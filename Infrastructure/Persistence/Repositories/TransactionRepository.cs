using Application.Exceptions;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using System.Security.Principal;

namespace Infrastructure.Persistence.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly ApplicationDbContext _context;

        public TransactionRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task AddTransactionAsync(Transaction transaction)
        {
            await _context.Transactions.AddAsync(transaction);
            await _context.SaveChangesAsync();
        }

        public IQueryable<Transaction> GetUserTransactionsQuery(Guid userId)
        {
            var transactions = _context.Transactions.AsNoTracking()
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.Account.UserId == userId);

            return transactions.AsQueryable();
        }

        public async Task<List<Transaction>> GetAllTransactionsByUserIdAsync(Guid userId)
        { 
            return await _context.Transactions.AsNoTracking()
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.Account.UserId == userId)
                .ToListAsync();
        }

        public async Task DeleteTransactionAsync(Guid transactionId)
        {
            _context.Transactions.Remove(_context.Transactions.Find(transactionId)!);
            await _context.SaveChangesAsync();
        }

        public async Task<Transaction?> GetTransactionByIdAsync(Guid transactionId)
        {
            return await _context.Transactions
                .AsNoTracking()
                .Include(t => t.Account)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == transactionId);
        }

        public async Task UpdateTransactionAsync(Transaction transaction)
        {
            var existing = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            if (existing == null)
                throw new NotFoundException("Transaction not found");

            existing.Amount = transaction.Amount;

            await _context.SaveChangesAsync();
        }

        public async Task<int> GetTransactionsCountByUserIdAsync(Guid userId, DateTime from, DateTime to)
        {
            var endDateExclusive = to.AddDays(1);

            return await _context.Transactions
                .AsNoTracking()
                .Where(t => t.Account.UserId == userId && 
                t.Date >= from && t.Date < endDateExclusive)
                .CountAsync();
        }

        public async Task<Dictionary<Guid, decimal>> GetTotalsByCategoryIdAsync(CategoryType type, DateTime from, DateTime to)
        {
            var endDateExclusive = to.AddDays(1);

            var totals = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.Category.Type == type && t.Date >= from && t.Date < endDateExclusive)
                .GroupBy(t => t.CategoryId)
                .Select(g => new
                {
                    CategoryId = g.Key,
                    TotalAmount = g.Sum(t => t.Amount)
                })
                .ToDictionaryAsync(x => x.CategoryId, x => x.TotalAmount);

            return totals;
        }
    }
}
