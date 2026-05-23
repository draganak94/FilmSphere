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
    }
}
