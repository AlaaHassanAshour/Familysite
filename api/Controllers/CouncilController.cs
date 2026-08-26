using Ashour.Api.Contracts;
using Ashour.Api.Data;
using Ashour.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Controllers;

[ApiController]
[Route("api/council")]
public class CouncilController(AshourDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var activities = await db.Activities
            .Include(x => x.Committee)
            .OrderBy(x => x.ScheduledAt)
            .Take(5)
            .Select(x => new { x.Id, x.Title, Committee = x.Committee!.Name, x.ScheduledAt, x.Status, x.Location })
            .ToListAsync(cancellationToken);

        var committees = await db.Committees
            .Include(x => x.Chairperson)
            .Include(x => x.Members)
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.Name, Lead = x.Chairperson != null ? x.Chairperson.FullName : "غير محدد", Members = x.Members.Count, Activities = x.Activities.Count })
            .ToListAsync(cancellationToken);

        var financialRecords = await db.FinancialRecords.AsNoTracking().ToListAsync(cancellationToken);
        var totalIncome = financialRecords.Where(r => r.RecordType == "Income").Sum(r => r.Amount);
        var totalExpense = financialRecords.Where(r => r.RecordType == "Expense").Sum(r => r.Amount);
        var balance = totalIncome - totalExpense;

        return Ok(new
        {
            members = await db.CouncilMembers.CountAsync(x => x.IsActive, cancellationToken),
            councilMembersCount = await db.CouncilMembers.CountAsync(x => x.IsActive && x.IsCouncilMember, cancellationToken),
            branches = await db.Branches.CountAsync(x => x.IsActive, cancellationToken),
            committees = await db.Committees.CountAsync(x => x.IsActive, cancellationToken),
            activities = await db.Activities.CountAsync(cancellationToken),
            decisions = await db.Decisions.CountAsync(cancellationToken),
            albums = await db.MediaAlbums.CountAsync(x => x.IsActive, cancellationToken),
            upcomingEvents = await db.UpcomingEvents.CountAsync(x => x.IsActive, cancellationToken),
            totalIncome,
            totalExpense,
            balance,
            upcomingActivities = activities,
            activeCommittees = committees
        });
    }

    [HttpGet("members")]
    public async Task<IActionResult> Members(
        [FromQuery] int? branchId,
        [FromQuery] string? status,
        [FromQuery] int? fatherId,
        [FromQuery] bool? isCouncilOnly,
        [FromQuery] string? search,
        CancellationToken cancellationToken = default)
    {
        var query = db.CouncilMembers
            .Include(x => x.Branch)
            .Include(x => x.Father)
            .Include(x => x.Children)
            .Where(x => x.IsActive)
            .AsQueryable();

        if (branchId.HasValue && branchId.Value > 0)
            query = query.Where(x => x.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
            query = query.Where(x => x.Status == status);

        if (fatherId.HasValue)
            query = query.Where(x => x.FatherId == fatherId.Value);

        if (isCouncilOnly.HasValue && isCouncilOnly.Value)
            query = query.Where(x => x.IsCouncilMember);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(x => x.FullName.Contains(s) ||
                                     (x.NationalId != null && x.NationalId.Contains(s)) ||
                                     (x.Phone != null && x.Phone.Contains(s)));
        }

        var results = await query
            .OrderBy(x => x.FullName)
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.NationalId,
                x.PhotoUrl,
                x.BirthDate,
                x.Phone,
                x.Email,
                x.Status,
                x.Gender,
                x.IsCouncilMember,
                x.CouncilRole,
                x.BranchId,
                Branch = x.Branch != null ? x.Branch.Name : "",
                x.FatherId,
                FatherName = x.Father != null ? x.Father.FullName : "رأس فرع / بدون أب مسجل",
                ChildrenCount = x.Children.Count(c => c.IsActive)
            })
            .ToListAsync(cancellationToken);

        return Ok(results);
    }

    [HttpPost("members")]
    public async Task<IActionResult> AddMember([FromBody] CreateMemberRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "الاسم الرباعي حقل مطلوب" });

        if (!await db.Branches.AnyAsync(x => x.Id == request.BranchId, cancellationToken))
            return BadRequest(new { message = "الفرع المحدد غير موجود" });

        if (request.FatherId.HasValue && request.FatherId.Value > 0)
        {
            if (!await db.CouncilMembers.AnyAsync(x => x.Id == request.FatherId.Value, cancellationToken))
                return BadRequest(new { message = "الأب المحدد غير موجود" });
        }

        var member = new CouncilMember
        {
            FullName = request.FullName.Trim(),
            NationalId = request.NationalId?.Trim(),
            PhotoUrl = request.PhotoUrl,
            BirthDate = request.BirthDate,
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "متزوج" : request.Status,
            Gender = string.IsNullOrWhiteSpace(request.Gender) ? "ذكر" : request.Gender,
            IsCouncilMember = request.IsCouncilMember,
            CouncilRole = string.IsNullOrWhiteSpace(request.CouncilRole) ? "فرد عائلة" : request.CouncilRole,
            BranchId = request.BranchId,
            FatherId = request.FatherId > 0 ? request.FatherId : null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.CouncilMembers.Add(member);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Members), new { id = member.Id }, member);
    }

    [HttpPut("members/{id:int}")]
    public async Task<IActionResult> UpdateMember(int id, [FromBody] UpdateMemberRequest request, CancellationToken cancellationToken)
    {
        var member = await db.CouncilMembers.FindAsync([id], cancellationToken);
        if (member is null) return NotFound(new { message = "العضو غير موجود" });

        if (request.FatherId.HasValue && request.FatherId.Value == id)
            return BadRequest(new { message = "لا يمكن أن يكون العضو أباً لنفسه" });

        member.FullName = request.FullName.Trim();
        member.NationalId = request.NationalId?.Trim();
        member.PhotoUrl = request.PhotoUrl;
        member.BirthDate = request.BirthDate;
        member.Phone = request.Phone?.Trim();
        member.Email = request.Email?.Trim();
        member.Status = request.Status;
        member.Gender = request.Gender;
        member.IsCouncilMember = request.IsCouncilMember;
        member.CouncilRole = request.CouncilRole;
        member.BranchId = request.BranchId;
        member.FatherId = request.FatherId > 0 ? request.FatherId : null;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(member);
    }

    [HttpDelete("members/{id:int}")]
    public async Task<IActionResult> DeleteMember(int id, CancellationToken cancellationToken)
    {
        var member = await db.CouncilMembers.FindAsync([id], cancellationToken);
        if (member is null) return NotFound(new { message = "العضو غير موجود" });

        member.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetFamilyTree([FromQuery] int? branchId, CancellationToken cancellationToken = default)
    {
        var query = db.CouncilMembers
            .Include(x => x.Branch)
            .Where(x => x.IsActive);

        if (branchId.HasValue && branchId.Value > 0)
            query = query.Where(x => x.BranchId == branchId.Value);

        var allMembers = await query.Select(x => new
        {
            x.Id,
            x.FullName,
            x.NationalId,
            x.PhotoUrl,
            x.BirthDate,
            x.Phone,
            x.Status,
            x.Gender,
            x.CouncilRole,
            x.IsCouncilMember,
            x.BranchId,
            BranchName = x.Branch != null ? x.Branch.Name : "",
            x.FatherId
        }).ToListAsync(cancellationToken);

        return Ok(allMembers);
    }

    // Committees
    [HttpGet("committees")]
    public async Task<IActionResult> Committees(CancellationToken cancellationToken)
    {
        var result = await db.Committees
            .Include(x => x.Chairperson)
            .Include(x => x.Members)
            .Include(x => x.Activities)
            .Where(x => x.IsActive)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                ChairpersonId = x.ChairpersonId,
                Chairperson = x.Chairperson != null ? x.Chairperson.FullName : "غير معين",
                ChairpersonPhoto = x.Chairperson != null ? x.Chairperson.PhotoUrl : null,
                Members = x.Members.Count,
                Activities = x.Activities.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpPost("committees")]
    public async Task<IActionResult> AddCommittee([FromBody] CreateCommitteeRequest request, CancellationToken cancellationToken)
    {
        if (!await db.CouncilMembers.AnyAsync(x => x.Id == request.ChairpersonId && x.IsActive, cancellationToken))
            return BadRequest(new { message = "مسؤول اللجنة غير موجود أو غير نشط" });

        var committee = new Committee
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ChairpersonId = request.ChairpersonId,
            IsActive = true
        };

        db.Committees.Add(committee);
        await db.SaveChangesAsync(cancellationToken);

        if (request.MemberIds != null && request.MemberIds.Length > 0)
        {
            var validMembers = await db.CouncilMembers
                .Where(x => request.MemberIds.Contains(x.Id) && x.IsActive)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            db.CommitteeMembers.AddRange(validMembers.Distinct().Select(id => new CommitteeMember
            {
                CommitteeId = committee.Id,
                CouncilMemberId = id,
                JoinedAt = DateTime.UtcNow
            }));
            await db.SaveChangesAsync(cancellationToken);
        }

        return CreatedAtAction(nameof(Committees), new { id = committee.Id }, committee);
    }

    [HttpGet("committees/{id:int}")]
    public async Task<IActionResult> CommitteeDetails(int id, CancellationToken cancellationToken)
    {
        var committee = await db.Committees
            .Include(x => x.Chairperson)
            .Include(x => x.Members).ThenInclude(x => x.CouncilMember)
            .Include(x => x.Activities)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (committee is null) return NotFound(new { message = "اللجنة غير موجودة" });

        return Ok(new
        {
            committee.Id,
            committee.Name,
            committee.Description,
            Chairperson = new
            {
                Id = committee.Chairperson?.Id ?? 0,
                FullName = committee.Chairperson?.FullName ?? "غير محدد",
                PhotoUrl = committee.Chairperson?.PhotoUrl,
                Phone = committee.Chairperson?.Phone,
                Role = committee.Chairperson?.CouncilRole
            },
            Members = committee.Members.Select(x => new
            {
                Id = x.CouncilMember?.Id ?? 0,
                FullName = x.CouncilMember?.FullName ?? "",
                CouncilRole = x.CouncilMember?.CouncilRole ?? "",
                PhotoUrl = x.CouncilMember?.PhotoUrl,
                Phone = x.CouncilMember?.Phone
            }),
            Activities = committee.Activities.OrderByDescending(a => a.ScheduledAt).Select(x => new
            {
                x.Id,
                x.Title,
                x.Description,
                x.ScheduledAt,
                x.Status,
                x.Location
            })
        });
    }

    [HttpPut("committees/{id:int}")]
    public async Task<IActionResult> UpdateCommittee(int id, [FromBody] UpdateCommitteeRequest request, CancellationToken cancellationToken)
    {
        var committee = await db.Committees.Include(x => x.Members).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (committee is null) return NotFound(new { message = "اللجنة غير موجودة" });

        committee.Name = request.Name.Trim();
        committee.Description = request.Description?.Trim();
        committee.ChairpersonId = request.ChairpersonId;

        db.CommitteeMembers.RemoveRange(committee.Members);
        if (request.MemberIds != null && request.MemberIds.Length > 0)
        {
            db.CommitteeMembers.AddRange(request.MemberIds.Distinct().Select(memberId => new CommitteeMember
            {
                CommitteeId = id,
                CouncilMemberId = memberId,
                JoinedAt = DateTime.UtcNow
            }));
        }

        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("committees/{id:int}")]
    public async Task<IActionResult> DeleteCommittee(int id, CancellationToken cancellationToken)
    {
        var committee = await db.Committees.FindAsync([id], cancellationToken);
        if (committee is null) return NotFound(new { message = "اللجنة غير موجودة" });

        committee.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // Activities
    [HttpGet("activities")]
    public async Task<IActionResult> Activities([FromQuery] int? limit, CancellationToken cancellationToken = default)
    {
        var query = db.Activities
            .Include(x => x.Committee)
            .OrderByDescending(x => x.ScheduledAt)
            .AsQueryable();

        if (limit.HasValue && limit.Value > 0)
            query = query.Take(limit.Value);

        var result = await query.Select(x => new
        {
            x.Id,
            x.Title,
            x.Description,
            x.ScheduledAt,
            x.Status,
            x.Location,
            x.ImageUrl,
            x.CommitteeId,
            CommitteeName = x.Committee != null ? x.Committee.Name : "لجنة عامة"
        }).ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpPost("activities")]
    public async Task<IActionResult> AddActivity([FromBody] CreateActivityRequest request, CancellationToken cancellationToken)
    {
        var activity = new Activity
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ScheduledAt = request.ScheduledAt,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Scheduled" : request.Status,
            Location = request.Location?.Trim(),
            ImageUrl = request.ImageUrl,
            CommitteeId = request.CommitteeId,
            CreatedAt = DateTime.UtcNow
        };

        db.Activities.Add(activity);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Activities), new { id = activity.Id }, activity);
    }

    [HttpPut("activities/{id:int}")]
    public async Task<IActionResult> UpdateActivity(int id, [FromBody] UpdateActivityRequest request, CancellationToken cancellationToken)
    {
        var activity = await db.Activities.FindAsync([id], cancellationToken);
        if (activity is null) return NotFound(new { message = "النشاط غير موجود" });

        activity.Title = request.Title.Trim();
        activity.Description = request.Description?.Trim();
        activity.ScheduledAt = request.ScheduledAt;
        activity.Status = request.Status;
        activity.Location = request.Location?.Trim();
        activity.ImageUrl = request.ImageUrl;
        activity.CommitteeId = request.CommitteeId;

        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("activities/{id:int}")]
    public async Task<IActionResult> DeleteActivity(int id, CancellationToken cancellationToken)
    {
        var activity = await db.Activities.FindAsync([id], cancellationToken);
        if (activity is null) return NotFound(new { message = "النشاط غير موجود" });

        db.Activities.Remove(activity);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // Decisions
    [HttpGet("decisions")]
    public async Task<IActionResult> Decisions(CancellationToken cancellationToken)
    {
        var result = await db.Decisions
            .OrderByDescending(x => x.DecisionDate)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Details,
                x.DecisionDate,
                x.ReferenceNumber,
                x.Status,
                x.AttachmentUrl,
                x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpPost("decisions")]
    public async Task<IActionResult> AddDecision([FromBody] CreateDecisionRequest request, CancellationToken cancellationToken)
    {
        var decision = new CouncilDecision
        {
            Title = request.Title.Trim(),
            Details = request.Details?.Trim(),
            DecisionDate = request.DecisionDate == default ? DateTime.UtcNow : request.DecisionDate,
            ReferenceNumber = request.ReferenceNumber?.Trim(),
            AttachmentUrl = request.AttachmentUrl,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Approved" : request.Status,
            CreatedAt = DateTime.UtcNow
        };

        db.Decisions.Add(decision);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Decisions), new { id = decision.Id }, decision);
    }

    [HttpPut("decisions/{id:int}")]
    public async Task<IActionResult> UpdateDecision(int id, [FromBody] UpdateDecisionRequest request, CancellationToken cancellationToken)
    {
        var decision = await db.Decisions.FindAsync([id], cancellationToken);
        if (decision is null) return NotFound(new { message = "القرار غير موجود" });

        decision.Title = request.Title.Trim();
        decision.Details = request.Details?.Trim();
        decision.DecisionDate = request.DecisionDate;
        decision.ReferenceNumber = request.ReferenceNumber?.Trim();
        decision.AttachmentUrl = request.AttachmentUrl;
        decision.Status = request.Status;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(decision);
    }

    [HttpDelete("decisions/{id:int}")]
    public async Task<IActionResult> DeleteDecision(int id, CancellationToken cancellationToken)
    {
        var decision = await db.Decisions.FindAsync([id], cancellationToken);
        if (decision is null) return NotFound(new { message = "القرار غير موجود" });

        db.Decisions.Remove(decision);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // Branches
    [HttpGet("branches")]
    public async Task<IActionResult> Branches(CancellationToken cancellationToken)
    {
        var result = await db.Branches
            .Include(x => x.Members)
            .Where(x => x.IsActive)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Location,
                x.Description,
                Members = x.Members.Count(m => m.IsActive)
            })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpPost("branches")]
    public async Task<IActionResult> AddBranch([FromBody] CreateBranchRequest request, CancellationToken cancellationToken)
    {
        var branch = new Branch
        {
            Name = request.Name.Trim(),
            Location = request.Location?.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true
        };

        db.Branches.Add(branch);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Branches), new { id = branch.Id }, branch);
    }

    // Settings
    [HttpGet("settings")]
    public async Task<IActionResult> Settings(CancellationToken cancellationToken)
    {
        var settings = await db.SiteSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        return Ok(settings ?? new SiteSettings());
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSiteSettingsRequest request, CancellationToken cancellationToken)
    {
        var settings = await db.SiteSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null)
        {
            settings = new SiteSettings();
            db.SiteSettings.Add(settings);
        }

        settings.FamilyName = request.FamilyName.Trim();
        settings.CouncilName = request.CouncilName.Trim();
        settings.LogoPath = request.LogoPath;
        settings.CoverImagePath = request.CoverImagePath;
        settings.WelcomeMessage = request.WelcomeMessage?.Trim();
        settings.HeroSubtitle = request.HeroSubtitle?.Trim();
        settings.VisionText = request.VisionText?.Trim();
        settings.Phone = request.Phone?.Trim();
        settings.Email = request.Email?.Trim();
        settings.Address = request.Address?.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return Ok(settings);
    }
}
