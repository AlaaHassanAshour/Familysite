namespace Ashour.Api.Contracts;

// Auth & Users
public record LoginRequest(string Username, string Password);
public record CreateUserRequest(string Username, string Password, string FullName, string? Email, string Role);
public record UpdateUserRequest(string FullName, string? Email, string Role, bool IsActive);
public record ChangePasswordRequest(string NewPassword);

// Family Members & Council
public record CreateMemberRequest(
    string FullName,
    string? NationalId,
    string? PhotoUrl,
    DateTime? BirthDate,
    string? Phone,
    string? Email,
    string Status,
    string Gender,
    bool IsCouncilMember,
    string CouncilRole,
    int BranchId,
    int? FatherId
);

public record UpdateMemberRequest(
    string FullName,
    string? NationalId,
    string? PhotoUrl,
    DateTime? BirthDate,
    string? Phone,
    string? Email,
    string Status,
    string Gender,
    bool IsCouncilMember,
    string CouncilRole,
    int BranchId,
    int? FatherId
);

// Committees
public record CreateCommitteeRequest(string Name, string? Description, int ChairpersonId, int[] MemberIds);
public record UpdateCommitteeRequest(string Name, string? Description, int ChairpersonId, int[] MemberIds);

// Activities
public record CreateActivityRequest(string Title, string? Description, DateTime ScheduledAt, string Status, string? Location, string? ImageUrl, int CommitteeId);
public record UpdateActivityRequest(string Title, string? Description, DateTime ScheduledAt, string Status, string? Location, string? ImageUrl, int CommitteeId);
//slider
public record CreateSliderRequest(string Title, string Badge, string Subtitle, string ButtonText, string ButtonUrl, int DisplayOrder, string? ImageUrl, bool isActive);
public record UpdateSliderRequest(string Title, string Badge, string Subtitle, string ButtonText, string ButtonUrl, int DisplayOrder, string? ImageUrl, bool isActive);


// Upcoming Events
public record CreateUpcomingEventRequest(string Title, string? Description, DateTime EventDate, string? Location, string EventType, string? ContactPerson);
public record UpdateUpcomingEventRequest(string Title, string? Description, DateTime EventDate, string? Location, string EventType, string? ContactPerson);

// Decisions
public record CreateDecisionRequest(string Title, string? Details, DateTime DecisionDate, string? ReferenceNumber, string? AttachmentUrl, string Status);
public record UpdateDecisionRequest(string Title, string? Details, DateTime DecisionDate, string? ReferenceNumber, string? AttachmentUrl, string Status);

// Branches
public record CreateBranchRequest(string Name, string? Location, string? Description);

// Media Albums
public record CreateAlbumRequest(string Title, string? Description, string? CoverImageUrl, DateTime? EventDate);
public record UpdateAlbumRequest(string Title, string? Description, string? CoverImageUrl, DateTime? EventDate);
public record CreateMediaItemRequest(int AlbumId, string FilePath, string MediaType, string? Title, string? Caption, long? FileSize);

// Finance
public record CreateFinancialRecordRequest(string RecordType, string Category, decimal Amount, DateTime TransactionDate, string? VoucherNumber, string? PartyName, string Description, string? AttachmentUrl);
public record UpdateFinancialRecordRequest(string RecordType, string Category, decimal Amount, DateTime TransactionDate, string? VoucherNumber, string? PartyName, string Description, string? AttachmentUrl);

// Site Settings
public record UpdateSiteSettingsRequest(string FamilyName, string CouncilName, string? LogoPath, string? CoverImagePath, string? WelcomeMessage, string? HeroSubtitle, string? VisionText, string? Phone, string? Email, string? Address);
