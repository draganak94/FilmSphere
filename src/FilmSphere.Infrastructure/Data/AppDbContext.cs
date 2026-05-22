using FilmSphere.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FilmSphere.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Film> Films => Set<Film>();

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
    }
}
