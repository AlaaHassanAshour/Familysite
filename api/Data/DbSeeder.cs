using Ashour.Api.Models;
using Ashour.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AshourDbContext db)
    {
        // 1. Seed Admin User
        if (!await db.Users.AnyAsync())
        {
            var (hash, salt) = SecurityHelper.HashPassword("Admin@123456");
            db.Users.Add(new User
            {
                Username = "admin",
                PasswordHash = hash,
                PasswordSalt = salt,
                FullName = "مدير النظام العام",
                Email = "admin@ashour-family.org",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        // 2. Seed the 6 Branches
        if (!await db.Branches.AnyAsync())
        {
            var branchNames = new[]
            {
                "فرع ديوان الحاج عبد الله",
                "فرع ديوان الحاج محمد",
                "فرع ديوان الشيخ محمود",
                "فرع ديوان الحاج إبراهيم",
                "فرع ديوان الحاج خليل",
                "فرع ديوان الحاج يوسف"
            };

            var branches = branchNames.Select((name, i) => new Branch
            {
                Name = name,
                Location = $"المنطقة {i + 1} - الحي الرئيسي",
                Description = $"الفرع رقم {i + 1} من فروع عائلة عاشور الستة الكبرى",
                IsActive = true
            }).ToList();

            db.Branches.AddRange(branches);
            await db.SaveChangesAsync();
        }

        var allBranches = await db.Branches.OrderBy(x => x.Id).ToListAsync();

        // 3. Seed Family Members with Hierarchy (Fathers, Sons, Statuses)
        if (!await db.CouncilMembers.AnyAsync())
        {
            // Generation 1: Ancestors / Branch Heads (No fathers - top of tree)
            var grandFather1 = new CouncilMember
            {
                FullName = "عبد الله إبراهيم عاشور",
                NationalId = "900112233",
                BirthDate = new DateTime(1935, 3, 15),
                Phone = "0599111222",
                Email = "abdullah@ashour-family.org",
                Status = "متوفي",
                Gender = "ذكر",
                IsCouncilMember = false,
                CouncilRole = "عميد العائلة (رحمه الله)",
                BranchId = allBranches[0].Id,
                FatherId = null,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var grandFather2 = new CouncilMember
            {
                FullName = "محمد خليل عاشور",
                NationalId = "900223344",
                BirthDate = new DateTime(1938, 7, 20),
                Phone = "0599222333",
                Status = "متوفي",
                Gender = "ذكر",
                IsCouncilMember = false,
                CouncilRole = "وجيه الفرع الثاني (رحمه الله)",
                BranchId = allBranches[1].Id,
                FatherId = null,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            db.CouncilMembers.AddRange(grandFather1, grandFather2);
            await db.SaveChangesAsync();

            // Generation 2: Sons (Council leaders & members)
            var member1 = new CouncilMember
            {
                FullName = "محمود عبد الله إبراهيم عاشور",
                NationalId = "911223344",
                BirthDate = new DateTime(1965, 5, 10),
                Phone = "0590000001",
                Email = "mahmoud@ashour-family.org",
                Status = "متزوج",
                Gender = "ذكر",
                IsCouncilMember = true,
                CouncilRole = "رئيس المجلس",
                BranchId = allBranches[0].Id,
                FatherId = grandFather1.Id,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var member2 = new CouncilMember
            {
                FullName = "أحمد محمد خليل عاشور",
                NationalId = "911334455",
                BirthDate = new DateTime(1970, 9, 14),
                Phone = "0590000002",
                Email = "ahmed@ashour-family.org",
                Status = "متزوج",
                Gender = "ذكر",
                IsCouncilMember = true,
                CouncilRole = "نائب رئيس المجلس",
                BranchId = allBranches[1].Id,
                FatherId = grandFather2.Id,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var member3 = new CouncilMember
            {
                FullName = "سارة محمود عبد الله عاشور",
                NationalId = "911445566",
                BirthDate = new DateTime(1988, 11, 25),
                Phone = "0590000003",
                Email = "sara@ashour-family.org",
                Status = "متزوج",
                Gender = "أنثى",
                IsCouncilMember = true,
                CouncilRole = "عضو مجلس ومسؤولة لجنة المرأة",
                BranchId = allBranches[0].Id,
                FatherId = grandFather1.Id,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var member4 = new CouncilMember
            {
                FullName = "خالد يوسف إبراهيم عاشور",
                NationalId = "911556677",
                BirthDate = new DateTime(1982, 4, 18),
                Phone = "0590000004",
                Email = "khaled@ashour-family.org",
                Status = "متزوج",
                Gender = "ذكر",
                IsCouncilMember = true,
                CouncilRole = "أمين السر",
                BranchId = allBranches[2].Id,
                FatherId = null,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var member5 = new CouncilMember
            {
                FullName = "يوسف محمود عبد الله عاشور",
                NationalId = "911667788",
                BirthDate = new DateTime(1975, 8, 30),
                Phone = "0590000005",
                Email = "youssef@ashour-family.org",
                Status = "متزوج",
                Gender = "ذكر",
                IsCouncilMember = true,
                CouncilRole = "أمين الصندوق",
                BranchId = allBranches[3].Id,
                FatherId = grandFather1.Id,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var martyrMember = new CouncilMember
            {
                FullName = "طارق عبد الله إبراهيم عاشور",
                NationalId = "911778899",
                BirthDate = new DateTime(1995, 1, 1),
                Phone = "0590000099",
                Status = "شهيد",
                Gender = "ذكر",
                IsCouncilMember = false,
                CouncilRole = "شهيد الواجب والوطن",
                BranchId = allBranches[0].Id,
                FatherId = grandFather1.Id,
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            var youngMember = new CouncilMember
            {
                FullName = "عبد الله محمود عبد الله عاشور",
                NationalId = "922889900",
                BirthDate = new DateTime(2000, 6, 12),
                Phone = "0590000100",
                Status = "أعزب",
                Gender = "ذكر",
                IsCouncilMember = false,
                CouncilRole = "فرد عائلة - ممثل الشباب",
                BranchId = allBranches[0].Id,
                FatherId = null, // will link to member1
                PhotoUrl = "/uploads/members/default-avatar.png"
            };

            db.CouncilMembers.AddRange(member1, member2, member3, member4, member5, martyrMember, youngMember);
            await db.SaveChangesAsync();

            // Link grandson father
            youngMember.FatherId = member1.Id;
            await db.SaveChangesAsync();
        }

        var councilMembers = await db.CouncilMembers.Where(x => x.IsCouncilMember).ToListAsync();

        // 4. Seed Committees
        if (!await db.Committees.AnyAsync() && councilMembers.Count >= 4)
        {
            var committees = new[]
            {
                new Committee { Name = "لجنة العلاقات والإصلاح", Description = "حل الخلافات، تعزيز أواصر التراحم، وتوثيق العلاقات مع العائلات الأخرى", ChairpersonId = councilMembers[1].Id },
                new Committee { Name = "لجنة المرأة والأسرة", Description = "رعاية شؤون الأسرة، تمكين المرأة، ودعم المناسبات والبرامج الاجتماعية", ChairpersonId = councilMembers[2].Id },
                new Committee { Name = "لجنة الشباب والرياضة", Description = "تنظيم الأنشطة الرياضية، تمكين الشباب وتطوير مهاراتهم الإبداعية والأكاديمية", ChairpersonId = councilMembers[3].Id },
                new Committee { Name = "لجنة التكافل وصندوق العائلة", Description = "إدارة التكافل الاجتماعي، دعم الأسر المتعففة وتسيير نفقات الصندوق", ChairpersonId = councilMembers[4].Id }
            };

            db.Committees.AddRange(committees);
            await db.SaveChangesAsync();

            // Committee memberships
            var allComms = await db.Committees.ToListAsync();
            foreach (var comm in allComms)
            {
                foreach (var member in councilMembers.Take(3))
                {
                    db.CommitteeMembers.Add(new CommitteeMember
                    {
                        CommitteeId = comm.Id,
                        CouncilMemberId = member.Id,
                        JoinedAt = DateTime.UtcNow
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        var allCommittees = await db.Committees.ToListAsync();

        // 5. Seed Activities
        if (!await db.Activities.AnyAsync() && allCommittees.Count > 0)
        {
            db.Activities.AddRange(
                new Activity
                {
                    Title = "حملة كسوة الشتاء والتكافل العائلي",
                    Description = "توزيع طرود غذائية وكسوة الشتاء على الأسر المتعففة من أبناء العائلة لتعزيز روح الأخوة والتكافل.",
                    ScheduledAt = DateTime.UtcNow.AddDays(2),
                    Status = "قيد التحضير",
                    Location = "ديوان عائلة عاشور المركزي",
                    CommitteeId = allCommittees[3].Id
                },
                new Activity
                {
                    Title = "بطولة الشهيد طارق عاشور لكرة القدم",
                    Description = "دوري رياضي سنوي يجمع شباب الفروع الستة للعائلة لتعزيز التعارف والتنافس الرياضي الشريف.",
                    ScheduledAt = DateTime.UtcNow.AddDays(10),
                    Status = "مجدول",
                    Location = "الملعب الرياضي البلدي",
                    CommitteeId = allCommittees[2].Id
                },
                new Activity
                {
                    Title = "ملتقى تكريم حفظة القرآن والمتفوقين",
                    Description = "احتفال سنوي لتكريم كوكبة من أبناء وبنات العائلة المتفوقين في الثانوية العامة والجامعات وحفظة القرآن الكريم.",
                    ScheduledAt = DateTime.UtcNow.AddDays(20),
                    Status = "مجدول",
                    Location = "قاعة المؤتمرات الكبرى",
                    CommitteeId = allCommittees[1].Id
                },
                new Activity
                {
                    Title = "الجلسة الدورية للجنة الإصلاح والعلاقات",
                    Description = "مناقشة القضايا الاجتماعية وتوثيق الروابط بين أبناء الفروع المختلفة.",
                    ScheduledAt = DateTime.UtcNow.AddDays(-5),
                    Status = "مكتمل",
                    Location = "ديوان الفرع الأول",
                    CommitteeId = allCommittees[0].Id
                }
            );
            await db.SaveChangesAsync();
        }

        // 6. Seed Upcoming Events (المناسبات والأحداث القادمة)
        if (!await db.UpcomingEvents.AnyAsync())
        {
            db.UpcomingEvents.AddRange(
                new UpcomingEvent
                {
                    Title = "حفل زفاف الشاب عبد الله محمود عاشور",
                    Description = "يتشرف ديوان عائلة عاشور بدعوتكم لحضور حفل زفاف ابننا الغالي عبد الله ومشاركتنا الفرح والسرور.",
                    EventDate = DateTime.UtcNow.AddDays(7),
                    Location = "صالة الميدان الكبرى",
                    EventType = "فرح وزفاف",
                    ContactPerson = "محمود عاشور (0590000001)"
                },
                new UpcomingEvent
                {
                    Title = "الاجتماع العمومي السنوي لمجلس العائلة",
                    Description = "عرض التقرير الإداري والمالي السنوي وانتخاب الهيئة الإدارية للجان.",
                    EventDate = DateTime.UtcNow.AddDays(15),
                    Location = "الديوان المركزي العام",
                    EventType = "اجتماع مجلس",
                    ContactPerson = "أمين السر (0590000004)"
                },
                new UpcomingEvent
                {
                    Title = "يوم التبرع بالدم لصالح جرحى العائلة والوطن",
                    Description = "مبادرة صحية إنسانية تحت رعاية لجنة التكافل الاجتماعي بالتعاون مع بنك الدم المركزي.",
                    EventDate = DateTime.UtcNow.AddDays(25),
                    Location = "مقر ديوان العائلة",
                    EventType = "مبادرة",
                    ContactPerson = "لجنة التكافل (0590000005)"
                }
            );
            await db.SaveChangesAsync();
        }

        // 7. Seed Council Decisions (قرارات المجلس)
        if (!await db.Decisions.AnyAsync())
        {
            db.Decisions.AddRange(
                new CouncilDecision
                {
                    Title = "اعتماد النظام الأساسي الجديد لصندوق التكافل العائلي",
                    Details = "قرر مجلس عائلة عاشور بإجماع الأعضاء اعتماد اللائحة التنفيذية لصندوق التكافل لضمان الشفافية والعدالة في توزيع المساعدات.",
                    DecisionDate = DateTime.UtcNow.AddDays(-15),
                    ReferenceNumber = "ق/ع/٢٠٢٦/٠١",
                    Status = "Approved"
                },
                new CouncilDecision
                {
                    Title = "تشكيل لجنة الشباب والابتكار ودعم المبادرات",
                    Details = "تم تكليف الأستاذ خالد عاشور برئاسة وتشكيل لجنة الشباب لتمثيل طموحات وتطلعات الجيل الصاعد.",
                    DecisionDate = DateTime.UtcNow.AddDays(-8),
                    ReferenceNumber = "ق/ع/٢٠٢٦/٠٢",
                    Status = "Approved"
                },
                new CouncilDecision
                {
                    Title = "تحديد مواعيد فتح الديوان المركزي لكافة الفروع",
                    Details = "اعتماد مواعيد الجلسات الأسبوعية واستقبال الضيوف وأبناء الفروع أيام السبت والثلاثاء من كل أسبوع.",
                    DecisionDate = DateTime.UtcNow.AddDays(-2),
                    ReferenceNumber = "ق/ع/٢٠٢٦/٠٣",
                    Status = "Approved"
                }
            );
            await db.SaveChangesAsync();
        }

        // 8. Seed Media Albums (وسائط وألبومات العائلة)
        if (!await db.MediaAlbums.AnyAsync())
        {
            var album1 = new MediaAlbum
            {
                Title = "ألبوم حفل تكريم أوائل الطلبة والمتفوقين ٢٠٢٥",
                Description = "صور وفيديوهات توثق فرحة أبناء وبنات العائلة بيوم التكريم السنوي وتوزيع الدروع والشهادات.",
                CoverImageUrl = "/uploads/albums/album-honor-cover.jpg",
                EventDate = DateTime.UtcNow.AddMonths(-1),
                CreatedAt = DateTime.UtcNow
            };

            var album2 = new MediaAlbum
            {
                Title = "ألبوم دوري العائلة الرياضي وبطولة الإخاء",
                Description = "تغطية مصورة ومقاطع فيديو لأقوى مباريات كرة القدم بين فروع العائلة ولحظات التتويج.",
                CoverImageUrl = "/uploads/albums/album-sports-cover.jpg",
                EventDate = DateTime.UtcNow.AddMonths(-2),
                CreatedAt = DateTime.UtcNow
            };

            db.MediaAlbums.AddRange(album1, album2);
            await db.SaveChangesAsync();

            db.MediaItems.AddRange(
                new MediaItem
                {
                    AlbumId = album1.Id,
                    FilePath = "/uploads/albums/sample1.jpg",
                    MediaType = "Photo",
                    Title = "صورة جماعية للمتفوقين مع رئيس المجلس",
                    Caption = "فرحة الفوج العاشر من متفوقي عائلة عاشور"
                },
                new MediaItem
                {
                    AlbumId = album1.Id,
                    FilePath = "/uploads/albums/sample2.jpg",
                    MediaType = "Photo",
                    Title = "كلمة رئيس مجلس العائلة في الحفل",
                    Caption = "تأكيد على أهمية العلم وبناء المستقبل"
                },
                new MediaItem
                {
                    AlbumId = album2.Id,
                    FilePath = "/uploads/albums/sports1.jpg",
                    MediaType = "Photo",
                    Title = "فريق الفرع الأول الفائز بالبطولة",
                    Caption = "المباراة النهائية على كأس ديوان العائلة"
                }
            );
            await db.SaveChangesAsync();
        }

        // 9. Seed Financial Records (صندوق ومالية العائلة)
        if (!await db.FinancialRecords.AnyAsync())
        {
            db.FinancialRecords.AddRange(
                new FinancialRecord
                {
                    RecordType = "Income",
                    Category = "اشتراكات أعضاء",
                    Amount = 15000.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-20),
                    VoucherNumber = "قبض-١٠١",
                    PartyName = "أعضاء ديوان الفرع الأول والثاني",
                    Description = "تحصيل الاشتراكات الشهرية والسنوية لدعم الصندوق العام"
                },
                new FinancialRecord
                {
                    RecordType = "Income",
                    Category = "تبرعات واردة",
                    Amount = 25000.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-15),
                    VoucherNumber = "قبض-١٠٢",
                    PartyName = "أهل الخير من مغتربي العائلة",
                    Description = "تبرع مخصص لدعم صندوق التكافل ومساعدة الأسر المستورة"
                },
                new FinancialRecord
                {
                    RecordType = "Expense",
                    Category = "مساعدات إنسانية",
                    Amount = 8500.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-10),
                    VoucherNumber = "صرف-٢٠١",
                    PartyName = "لجنة التكافل الاجتماعي",
                    Description = "صرف طرود غذائية ومساعدات عاجلة للأسر المتضررة والمحتاجة"
                },
                new FinancialRecord
                {
                    RecordType = "Expense",
                    Category = "فعاليات وأنشطة",
                    Amount = 4200.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-5),
                    VoucherNumber = "صرف-٢٠٢",
                    PartyName = "إدارة قاعة المؤتمرات وتجهيزات الضيافة",
                    Description = "تغطية تكاليف حفل تكريم المتفوقين والجوائز التقديرية"
                },
                new FinancialRecord
                {
                    RecordType = "Expense",
                    Category = "مصاريف تشغيلية",
                    Amount = 1800.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-2),
                    VoucherNumber = "صرف-٢٠٣",
                    PartyName = "شركة الكهرباء والخدمات العامة",
                    Description = "صيانة وإنارة وتجهيزات ديوان العائلة المركزي"
                }
            );
            await db.SaveChangesAsync();
        }

        // 10. Seed Site Settings
        if (!await db.SiteSettings.AnyAsync())
        {
            db.SiteSettings.Add(new SiteSettings
            {
                FamilyName = "عائلة عاشور",
                CouncilName = "مجلس عائلة عاشور الرسمي",
                WelcomeMessage = "مرحباً بكم في المنصة الرسمية لديوان ومجلس عائلة عاشور",
                HeroSubtitle = "أصالة، ترابط وتكافل، وبناء مستقبل مشرق لأبناء العائلة",
                VisionText = "تعزيز أواصر القربى والتكافل الاجتماعي وتمكين طاقات الشباب وتوثيق تاريخ وإنجازات العائلة في الوطن والمهجر.",
                Phone = "0590000000",
                Email = "info@ashour-family.org",
                Address = "ديوان عائلة عاشور العام - المقر المركزي"
            });
            await db.SaveChangesAsync();
        }
    }
}
