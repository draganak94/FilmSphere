using FilmSphere.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FilmSphere.API.Controllers;

[ApiController]
[Route("api/stripe")]
public class StripeController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet("config")]
    [Authorize]
    public IActionResult GetConfig() =>
        Ok(new { publishableKey = config["Stripe:PublishableKey"] });

    [HttpPost("create-subscription")]
    [Authorize]
    public async Task<IActionResult> CreateSubscription()
    {
        var userId = UserId;
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        if (user.IsSubscribed) return BadRequest(new { message = "Already a VIP member." });

        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

        var product = await new ProductService().CreateAsync(new ProductCreateOptions
        {
            Name = "FilmSphere VIP"
        });

        var customerOptions = new CustomerCreateOptions
        {
            Email = user.Email,
            Metadata = new Dictionary<string, string> { { "userId", userId.ToString() } }
        };
        var customer = await new CustomerService().CreateAsync(customerOptions);

        var subscriptionOptions = new SubscriptionCreateOptions
        {
            Customer = customer.Id,
            Items =
            [
                new SubscriptionItemOptions
                {
                    PriceData = new SubscriptionItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = 999,
                        Recurring = new SubscriptionItemPriceDataRecurringOptions
                        {
                            Interval = "month"
                        },
                        Product = product.Id
                    }
                }
            ],
            PaymentBehavior = "default_incomplete",
            PaymentSettings = new SubscriptionPaymentSettingsOptions
            {
                SaveDefaultPaymentMethod = "on_subscription"
            },
            Expand = ["latest_invoice.payment_intent"],
            Metadata = new Dictionary<string, string> { { "userId", userId.ToString() } }
        };

        var subscription = await new SubscriptionService().CreateAsync(subscriptionOptions);
        var clientSecret = subscription.LatestInvoice.PaymentIntent.ClientSecret;

        return Ok(new { clientSecret, subscriptionId = subscription.Id });
    }

    [HttpPost("confirm-payment")]
    [Authorize]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
    {
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

        var intent = await new PaymentIntentService().GetAsync(request.PaymentIntentId);

        if (intent.Status != "succeeded")
            return BadRequest(new { message = "Payment not completed." });

        var userId = UserId;
        await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsSubscribed, true));

        return Ok();
    }

    [HttpPost("cancel")]
    [Authorize]
    public async Task<IActionResult> CancelSubscription()
    {
        var userId = UserId;
        await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsSubscribed, false));
        return Ok();
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var payload = await new StreamReader(Request.Body).ReadToEndAsync();
        var sig = Request.Headers["Stripe-Signature"];
        var secret = config["Stripe:WebhookSecret"]!;

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, sig, secret, throwOnApiVersionMismatch: false);
        }
        catch (StripeException)
        {
            return BadRequest();
        }

        if (stripeEvent.Type == "invoice.payment_succeeded")
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            var subscriptionId = invoice?.SubscriptionId;
            if (subscriptionId is not null)
            {
                var subscription = await new SubscriptionService().GetAsync(subscriptionId);
                if (subscription.Metadata?.TryGetValue("userId", out var rawId) == true
                    && Guid.TryParse(rawId, out var guid))
                {
                    await db.Users
                        .Where(u => u.Id == guid)
                        .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsSubscribed, true));
                }
            }
        }

        return Ok();
    }
}

public class ConfirmPaymentRequest
{
    public string PaymentIntentId { get; set; } = string.Empty;
}
