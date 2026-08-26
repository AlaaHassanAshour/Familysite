using Ashour.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
var connectionString = builder.Configuration.GetConnectionString("AshourDatabase")
    ?? throw new InvalidOperationException("ConnectionStrings:AshourDatabase is missing.");
builder.Services.AddDbContext<AshourDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("AshourDatabase"),
        sqlOptions =>
        {
            // تفعيل إعادة المحاولة التلقائية للأخطاء اللحظية
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,             // عدد المحاولات (الافتراضي 6)
                maxRetryDelay: TimeSpan.FromSeconds(30), // أقصى زمن انتظار بين المحاولات
                errorNumbersToAdd: null       // أرقام أخطاء SQL إضافية للتعامل معها
            );
        }));



builder.Services.AddCors(options => options.AddPolicy("Client", policy =>
    policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:8000", "http://localhost:8000", "http://127.0.0.1:4200", "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

// OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Ensure uploads directories exist
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
Directory.CreateDirectory(Path.Combine(uploadsPath, "members"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "albums"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "finance"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "general"));

// Migrate and Seed Database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AshourDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Client");

// Serve Static Files for Uploaded Media
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");
app.Run();
