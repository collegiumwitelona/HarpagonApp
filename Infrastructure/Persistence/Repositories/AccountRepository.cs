using Application.Exceptions;
using Domain.Interfaces;
using Domain.Models;
using Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly ApplicationDbContext _context;
        public AccountRepository(ApplicationDbContext context) {
            _context = context;
        }
        public async Task<Account> AddAccountAsync(Account account)
        {
            await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();
            return account;
        }

        public async Task DeleteAccountAsync(Guid accountId)
        {
            _context.Accounts.Remove(_context.Accounts.Find(accountId)!);
            await _context.SaveChangesAsync();
        }

        public async Task<Account?> GetAccountByIdAsync(Guid accountId)
        {
            return await _context.Accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == accountId);
        }

        public Task<List<Account>> GetAccountsByUserIdAsync(Guid userId)
        {
            return _context.Accounts
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .ToListAsync();
        }

        public async Task UpdateAccountAsync(Account account)
        {
            var existing = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == account.Id);

            if (existing == null)
                throw new NotFoundException("Account not found");

            existing.Name = account.Name;
            existing.Balance = account.Balance;
            existing.Goal = account.Goal;

            await _context.SaveChangesAsync();
        }
    }
}
