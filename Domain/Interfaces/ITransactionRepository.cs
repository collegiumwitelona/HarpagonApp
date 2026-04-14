using Domain.Enums;
using Domain.Models;

namespace Domain.Interfaces
{
    public interface ITransactionRepository
    {
        Task AddTransactionAsync(Transaction transaction);
        IQueryable<Transaction> GetTransactionsByUserId(Guid userId);
        Task<Dictionary<Guid, decimal>> GetTotalsByCategoryIdAsync(CategoryType type);
        Task<Transaction?> GetTransactionByIdAsync(Guid transactionId);
        Task<int> GetTransactionsCountByUserIdAsync(Guid userId, DateTime from, DateTime to);
        Task DeleteTransactionAsync(Guid transactionId);
        Task UpdateTransactionAsync(Transaction transaction);
    }
}