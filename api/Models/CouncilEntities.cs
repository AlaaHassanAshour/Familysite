namespace Ashour.Api.Models;

public class User
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public required string PasswordSalt { get; set; }
    public required string FullName { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = "Admin"; // Admin, Editor, Viewer
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}

public class Branch
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<CouncilMember> Members { get; set; } = [];
}

public class CouncilMember
{
    public int Id { get; set; }
    public required string FullName { get; set; }
    public string? NationalId { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    
    // Status: متزوج, أعزب, شهيد, متوفي, مطلق, أرمل
    public string Status { get; set; } = "متزوج";
    public string Gender { get; set; } = "ذكر"; // ذكر, أنثى

    // Council specific
    public bool IsCouncilMember { get; set; } = true;
    public string CouncilRole { get; set; } = "عضو مجلس"; // رئيس المجلس, نائب الرئيس, أمين السر, أمين الصندوق, عضو مجلس, فرد عائلة
    public bool IsActive { get; set; } = true;

    // Branch (One of 6 branches)
    public int BranchId { get; set; }
    public Branch? Branch { get; set; }

    // Family Tree Self-referencing Parent (Father)
    public int? FatherId { get; set; }
    public CouncilMember? Father { get; set; }
    public ICollection<CouncilMember> Children { get; set; } = [];

    // Committees
    public ICollection<Committee> LedCommittees { get; set; } = [];
    public ICollection<CommitteeMember> CommitteeMemberships { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Committee
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int ChairpersonId { get; set; }
    public CouncilMember? Chairperson { get; set; }
    public ICollection<CommitteeMember> Members { get; set; } = [];
    public ICollection<Activity> Activities { get; set; } = [];
}

public class CommitteeMember
{
    public int CommitteeId { get; set; }
    public Committee? Committee { get; set; }
    public int CouncilMemberId { get; set; }
    public CouncilMember? CouncilMember { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class Activity
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, InProgress, Completed, Cancelled
    public string? Location { get; set; }
    public string? ImageUrl { get; set; }
    public int CommitteeId { get; set; }
    public Committee? Committee { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UpcomingEvent
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
    public string? Location { get; set; }
    public string EventType { get; set; } = "مناسبة عامة"; // مناسبة عامة, فرح وزفاف, حفل تكريم, عزاء, اجتماع مجلس, مبادرة
    public string? ContactPerson { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CouncilDecision
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Details { get; set; }
    public DateTime DecisionDate { get; set; }
    public string Status { get; set; } = "Approved"; // Approved, Active, Archived
    public string? ReferenceNumber { get; set; }
    public string? AttachmentUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class MediaAlbum
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateTime? EventDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<MediaItem> Items { get; set; } = [];
}

public class MediaItem
{
    public int Id { get; set; }
    public int AlbumId { get; set; }
    public MediaAlbum? Album { get; set; }
    public required string FilePath { get; set; }
    public string MediaType { get; set; } = "Photo"; // Photo, Video
    public string? Title { get; set; }
    public string? Caption { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class FinancialRecord
{
    public int Id { get; set; }
    // RecordType: Income (إيراد), Expense (مصروف)
    public string RecordType { get; set; } = "Expense";
    
    // Category: مساعدات إنسانية, كفالات, فعاليات وأنشطة, مصاريف تشغيلية, تبرعات واردة, اشتراكات أعضاء, أخرى
    public required string Category { get; set; }
    
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string? VoucherNumber { get; set; } // رقم السند / الإيصال
    public string? PartyName { get; set; } // الجهة المستلمة / الدافعة
    public required string Description { get; set; } // أسباب ومجالات الصرف / البيان
    public string? AttachmentUrl { get; set; } // صورة السند / الفاتورة
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SiteSettings
{
    public int Id { get; set; }
    public string FamilyName { get; set; } = "عائلة عاشور";
    public string CouncilName { get; set; } = "مجلس عائلة عاشور";
    public string? LogoPath { get; set; }
    public string? CoverImagePath { get; set; }
    public string? WelcomeMessage { get; set; } = "مرحباً بكم في المنصة الرسمية لمجلس عائلة عاشور";
    public string? HeroSubtitle { get; set; } = "أصالة، ترابط وتكافل، وبناء مستقبل مشرق لأبناء العائلة";
    public string? VisionText { get; set; } = "تعزيز أواصر القربى والتكافل الاجتماعي وتمكين طاقات الشباب وتوثيق تاريخ وإنجازات العائلة.";
    public string? Phone { get; set; } = "0590000000";
    public string? Email { get; set; } = "contact@ashour-family.org";
    public string? Address { get; set; } = "ديوان عائلة عاشور العام";
}
public class SliderImage
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    // الخصائص الجديدة:
    public string? Badge { get; set; }     // مثل: "أهلاً وسهلاً"، "خبر هام"، "جديد"
    public string? Subtitle { get; set; }  // العنوان الفرعي أو النص الوصفي

    public string? ImageUrl { get; set; }
    public string? ButtonText { get; set; }
    public string? ButtonUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

