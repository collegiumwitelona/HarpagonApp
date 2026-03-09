using Domain.Models;

namespace Domain.Interfaces
{
    public interface ITransactionRepository
    {
        Task AddTransactionAsync(Transaction transaction);
        Task<List<Transaction>> GetTransactionsByUserIdAsync(Guid userId);
        Task DeleteTransactionAsync(Transaction transaction);
        Task<Transaction?> GetTransactionByIdAsync(Guid transactionId);
        Task UpdateTransactionAsync(Transaction transaction);
        Task ExecuteInTransactionAsync(Func<Task> operations);
    }
}