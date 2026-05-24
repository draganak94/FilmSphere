using FilmSphere.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FilmSphere.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Film> Films => Set<Film>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ReviewLike> ReviewLikes => Set<ReviewLike>();
    public DbSet<WatchlistItem> WatchlistItems => Set<WatchlistItem>();
    public DbSet<FilmLike> FilmLikes => Set<FilmLike>();
    public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<UserFavorite> UserFavorites => Set<UserFavorite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.IsSubscribed).HasDefaultValue(false);
        });

        modelBuilder.Entity<Film>(e =>
        {
            e.Property(f => f.Id).UseIdentityColumn();
        });

        modelBuilder.Entity<ReviewLike>(e =>
        {
            e.HasKey(l => new { l.ReviewId, l.UserId });
        });

        modelBuilder.Entity<WatchlistItem>(e =>
        {
            e.HasIndex(w => new { w.UserId, w.FilmId }).IsUnique();
        });

        modelBuilder.Entity<FilmLike>(e =>
        {
            e.HasKey(l => new { l.FilmId, l.UserId });
        });

        modelBuilder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Sender)
             .WithMany()
             .HasForeignKey(m => m.SenderId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Receiver)
             .WithMany()
             .HasForeignKey(m => m.ReceiverId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(m => new { m.SenderId, m.ReceiverId });
            e.HasIndex(m => m.ReceiverId);
        });

        modelBuilder.Entity<UserFavorite>(e =>
        {
            e.HasKey(f => new { f.UserId, f.FilmId });
        });

        modelBuilder.Entity<FriendRequest>(e =>
        {
            e.HasIndex(r => new { r.SenderId, r.ReceiverId }).IsUnique();
            e.Property(r => r.Status).HasConversion<string>();
            e.HasOne(r => r.Sender)
             .WithMany()
             .HasForeignKey(r => r.SenderId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Receiver)
             .WithMany()
             .HasForeignKey(r => r.ReceiverId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
