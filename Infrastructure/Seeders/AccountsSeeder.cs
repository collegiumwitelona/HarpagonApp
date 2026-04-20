using Domain.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Seeders
{
    public static class AccountsSeeder
    {
        public static async Task SeedAccounts(IServiceProvider serviceProvider)
        {
            var _accountRepository = serviceProvider.GetRequiredService<IAccountRepository>();
            var _userManager = serviceProvider.GetRequiredService<UserManager<User>>();

            foreach (var user in _userManager.Users.ToList())
            {
                for (int i = 0; i < 3; i++)
                {
                    var account = new Account
                    {
                        Id = Guid.NewGuid(),
                        Name = $"Bank account {i}",
                        Balance = Random.Shared.Next(1000, 5000),
                        UserId = user.Id,
                    };

                    await _accountRepository.AddAccountAsync(account);
                }
            }
        }
    }
}
