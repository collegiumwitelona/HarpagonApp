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

        public async Task<List<Transaction>> GetTransactionsByUserIdAsync(Guid userId)
        {
            var transactions = _context.Transactions.AsNoTracking()
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.Account.UserId == userId)
                .AsQueryable();

            //pagination/filtering place

            var result = await transactions.ToListAsync();
            return result;
        }

        public async Task DeleteTransactionAsync(Transaction transaction)
        {
            _context.Transactions.Remove(transaction);
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

        public async Task ExecuteInTransactionAsync(Func<Task> operations)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await operations();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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

        public async Task<Dictionary<Guid, decimal>> GetTotalsByCategoryIdAsync(CategoryType type)
        {
            var totals = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.Category.Type == type)
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
