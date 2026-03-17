using Domain.Enums;
using Domain.Models;

namespace Domain.Interfaces
{
    public interface ITransactionRepository
    {
        Task AddTransactionAsync(Transaction transaction);
        Task<List<Transaction>> GetTransactionsByUserIdAsync(Guid userId);
        Task<Dictionary<Guid, decimal>> GetTotalsByCategoryIdAsync(CategoryType type);
        Task<Transaction?> GetTransactionByIdAsync(Guid transactionId);
        Task<int> GetTransactionsCountByUserIdAsync(Guid userId, DateTime from, DateTime to);
        Task DeleteTransactionAsync(Transaction transaction);
        Task UpdateTransactionAsync(Transaction transaction);
        Task ExecuteInTransactionAsync(Func<Task> operations);
    }
}