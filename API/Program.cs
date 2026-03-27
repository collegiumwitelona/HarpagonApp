using API.Extensions;
using Application.Interfaces.Core;
using Application.Interfaces.Infrastructure;
using Application.Services;
using Domain.Interfaces;
using Domain.Models;
using Infrastructure.BackgroundServices;
using Infrastructure.Caching;
using Infrastructure.Email;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Seeders;
using Infrastructure.Shared;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//Add DbContext with PostgreSQL provider
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;

if (connectionString.StartsWith("postgresql://"))
{
    connectionString = ConnectionStringConverter.ConvertPostgresUrl(connectionString);
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

//cache
var redisUrl = builder.Configuration.GetConnectionString("Redis")!;

if (redisUrl.StartsWith("redis://"))
{
    redisUrl = ConnectionStringConverter.ConvertRedisUrl(redisUrl);
}


builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisUrl;
    options.InstanceName = "HarpagonApp";
});

//Add Identity services
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
    options.TokenLifespan = TimeSpan.FromHours(3));

//jwt configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters.ValidIssuer = builder.Configuration["Jwt:Issuer"];
    options.TokenValidationParameters.ValidAudience = builder.Configuration["Jwt:Audience"];
    options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey not configured"))
    );
});

builder.Services.AddAuthorization();

//Add repositories
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IAccountRepository, AccountRepository>();

//Add services
builder.Services.AddScoped<ICacheService, RedisCacheService>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuthEmailService, AuthEmailService>();
builder.Services.AddScoped<ITokenService, JwtService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IFrontendLinkBuilder, FrontendLinkBuilder>();


if (builder.Configuration["EMAIL_PROVIDER"] == "MAILGUN") {
    builder.Services.AddScoped<IEmailService, MailgunEmailSender>();
}
else {
    builder.Services.AddScoped<IEmailService, MailpitEmailSender>();
}


builder.Services.AddTransient<IHashService, HashService>();

builder.Services.AddHostedService<TokenCleanupService>();



builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });


//CORS
var frontendUrl = builder.Configuration["Frontend:Url"]
    ?? throw new InvalidOperationException("Frontend:Url not configured");

builder.Services.AddCors(options =>
{
    options.AddPolicy("Policy", policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddLocalization();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Input jwt token {token}'"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

var app = builder.Build();

// Apply pending migrations and seed the database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        if (dbContext.Database.GetPendingMigrations().Any())
        {
            logger.LogInformation("Applying pending migrations...");
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Migrations applied successfully.");
        }

        await RolesSeeder.SeedRoles(services);

        if (!userManager.Users.Any())
        {
            await UsersSeeder.SeedUsers(services);
        }
        if (!dbContext.Categories.Any())
        {
            await CategorySeeder.SeedCategories(services);
        }
        if (!dbContext.Accounts.Any())
        {
            await AccountsSeeder.SeedAccounts(services);
        }
        if (app.Environment.IsDevelopment())
        {
            if (!dbContext.Transactions.Any())
            {
                await TransactionsSeeder.SeedTransactions(services);
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "error during migration/seeds");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//Localization
var supportedCultures = new[] { "en-US", "pl-PL" };
var localizeOptions = new RequestLocalizationOptions()
    .SetDefaultCulture("pl-PL")
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

app.UseRequestLocalization(localizeOptions);

app.UseExceptionMiddleware();
app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("Policy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();