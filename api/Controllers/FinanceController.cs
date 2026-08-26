using Ashour.Api.Contracts;
using Ashour.Api.Data;
using Ashour.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Controllers;

[ApiController]
[Route("api/finance")]
public class FinanceController(AshourDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var records = await db.FinancialRecords.AsNoTracking().ToListAsync(cancellationToken);

        var totalIncome = records.Where(r => r.RecordType == "Income").Sum(r => r.Amount);
        var totalExpense = records.Where(r => r.RecordType == "Expense").Sum(r => r.Amount);
        var balance = totalIncome - totalExpense;

        var categoryBreakdown = records
            .GroupBy(r => new { r.Category, r.RecordType })
            .Select(g => new
            {
                Category = g.Key.Category,
                RecordType = g.Key.RecordType,
                Total = g.Sum(r => r.Amount),
                Count = g.Count()
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        var recent = records
            .OrderByDescending(r => r.TransactionDate)
            .Take(5)
            .Select(r => new
            {
                r.Id,
                r.RecordType,
                r.Category,
                r.Amount,
                r.TransactionDate,
                r.VoucherNumber,
                r.PartyName,
                r.Description,
                r.AttachmentUrl
            })
            .ToList();

        return Ok(new
        {
            totalIncome,
            totalExpense,
            balance,
            incomeCount = records.Count(r => r.RecordType == "Income"),
            expenseCount = records.Count(r => r.RecordType == "Expense"),
            totalRecords = records.Count,
            categoryBreakdown,
            recentTransactions = recent
        });
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords(
        [FromQuery] string? recordType,
        [FromQuery] string? category,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? search,
        CancellationToken cancellationToken = default)
    {
        var query = db.FinancialRecords.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(recordType) && recordType != "all")
        {
            query = query.Where(r => r.RecordType == recordType);
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
        {
            query = query.Where(r => r.Category == category);
        }

        if (startDate.HasValue)
        {
            query = query.Where(r => r.TransactionDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(r => r.TransactionDate <= endDate.Value.AddDays(1));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(r => r.Description.Contains(s) ||
                                     (r.PartyName != null && r.PartyName.Contains(s)) ||
                                     (r.VoucherNumber != null && r.VoucherNumber.Contains(s)));
        }

        var results = await query
            .OrderByDescending(r => r.TransactionDate)
            .Select(r => new
            {
                r.Id,
                r.RecordType,
                r.Category,
                r.Amount,
                r.TransactionDate,
                r.VoucherNumber,
                r.PartyName,
                r.Description,
                r.AttachmentUrl,
                r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(results);
    }

    [HttpPost("records")]
    public async Task<IActionResult> CreateRecord([FromBody] CreateFinancialRecordRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
            return BadRequest(new { message = "المبلغ يجب أن يكون أكبر من صفر" });

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(new { message = "بيان العملية وسبب الصرف/القبض حقل مطلوب" });

        var record = new FinancialRecord
        {
            RecordType = request.RecordType == "Income" ? "Income" : "Expense",
            Category = request.Category.Trim(),
            Amount = request.Amount,
            TransactionDate = request.TransactionDate == default ? DateTime.UtcNow : request.TransactionDate,
            VoucherNumber = request.VoucherNumber?.Trim(),
            PartyName = request.PartyName?.Trim(),
            Description = request.Description.Trim(),
            AttachmentUrl = request.AttachmentUrl,
            CreatedAt = DateTime.UtcNow
        };

        db.FinancialRecords.Add(record);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(record);
    }

    [HttpPut("records/{id:int}")]
    public async Task<IActionResult> UpdateRecord(int id, [FromBody] UpdateFinancialRecordRequest request, CancellationToken cancellationToken)
    {
        var record = await db.FinancialRecords.FindAsync([id], cancellationToken);
        if (record is null) return NotFound(new { message = "السجل المالي غير موجود" });

        if (request.Amount <= 0)
            return BadRequest(new { message = "المبلغ يجب أن يكون أكبر من صفر" });

        record.RecordType = request.RecordType == "Income" ? "Income" : "Expense";
        record.Category = request.Category.Trim();
        record.Amount = request.Amount;
        record.TransactionDate = request.TransactionDate;
        record.VoucherNumber = request.VoucherNumber?.Trim();
        record.PartyName = request.PartyName?.Trim();
        record.Description = request.Description.Trim();
        record.AttachmentUrl = request.AttachmentUrl;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(record);
    }

    [HttpDelete("records/{id:int}")]
    public async Task<IActionResult> DeleteRecord(int id, CancellationToken cancellationToken)
    {
        var record = await db.FinancialRecords.FindAsync([id], cancellationToken);
        if (record is null) return NotFound(new { message = "السجل المالي غير موجود" });

        db.FinancialRecords.Remove(record);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم حذف السجل المالي بنجاح" });
    }
}
