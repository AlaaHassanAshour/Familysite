using Ashour.Api.Data;
using Ashour.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("AshourDatabase")
    ?? throw new InvalidOperationException("ConnectionStrings:AshourDatabase is missing.");

builder.Services.AddDbContext<AshourDbContext>(options =>
    options.UseSqlServer(
        connectionString,
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null
            );
        }));
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddCors(options => options.AddPolicy("Client", policy =>
    policy.WithOrigins("http://localhost:4200", "https://alaahashour-001-site1.ltempurl.com", "http://127.0.0.1:8000", "http://localhost:8000", "http://127.0.0.1:4200", "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

builder.Services.AddOpenApi();
builder.Services.AddScoped<IUplodeFile, UplodeFile>();
var app = builder.Build();

// Ensure uploads directories exist
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
Directory.CreateDirectory(Path.Combine(uploadsPath, "members"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "albums"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "finance"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "general"));

// Migrate and Seed Database
//using (var scope = app.Services.CreateScope())
//{
//    var db = scope.ServiceProvider.GetRequiredService<AshourDbContext>();
//    await db.Database.MigrateAsync();
//    await DbSeeder.SeedAsync(db);
//}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 1. تفعيل حزمة الملفات الافتراضية (تخديم index.html كمستند أولي)
app.UseDefaultFiles();

// 2. تفعيل static files الافتراضي لتخديم ملفات Angular من مجلد wwwroot (مهم جداً!)
app.UseStaticFiles();

// 3. تفعيل static files الخاص بمجلد uploads
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors("Client");

app.UseAuthorization();

app.MapControllers();

// 4. توجيه جميع المسارات الداخلية غير المعروفة إلى index.html لعمل Angular Routing
app.MapFallbackToFile("index.html");

app.Run();