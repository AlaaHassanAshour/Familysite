using Ashour.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Data;

public class AshourDbContext(DbContextOptions<AshourDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<CouncilMember> CouncilMembers => Set<CouncilMember>();
    public DbSet<Committee> Committees => Set<Committee>();
    public DbSet<CommitteeMember> CommitteeMembers => Set<CommitteeMember>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<UpcomingEvent> UpcomingEvents => Set<UpcomingEvent>();
    public DbSet<CouncilDecision> Decisions => Set<CouncilDecision>();
    public DbSet<MediaAlbum> MediaAlbums => Set<MediaAlbum>();
    public DbSet<MediaItem> MediaItems => Set<MediaItem>();
    public DbSet<FinancialRecord> FinancialRecords => Set<FinancialRecord>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(x => x.Username).IsUnique();
        modelBuilder.Entity<CommitteeMember>().HasKey(x => new { x.CommitteeId, x.CouncilMemberId });
        modelBuilder.Entity<CommitteeMember>().HasOne(x => x.Committee).WithMany(x => x.Members).HasForeignKey(x => x.CommitteeId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CommitteeMember>().HasOne(x => x.CouncilMember).WithMany(x => x.CommitteeMemberships).HasForeignKey(x => x.CouncilMemberId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Committee>().HasOne(x => x.Chairperson).WithMany(x => x.LedCommittees).HasForeignKey(x => x.ChairpersonId).OnDelete(DeleteBehavior.Restrict);
        
        // Self-referencing Father-Child for Family Tree
        modelBuilder.Entity<CouncilMember>().HasOne(x => x.Father).WithMany(x => x.Children).HasForeignKey(x => x.FatherId).OnDelete(DeleteBehavior.Restrict);
        
        // Media items
        modelBuilder.Entity<MediaItem>().HasOne(x => x.Album).WithMany(x => x.Items).HasForeignKey(x => x.AlbumId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Branch>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<FinancialRecord>().Property(x => x.Amount).HasPrecision(18, 2);
    }
}

