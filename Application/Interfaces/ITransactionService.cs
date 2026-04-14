using Application.DTO.Requests.Filtering;
using Application.DTO.Requests.Transactions;
using Application.DTO.Responses;

namespace Application.Interfaces
{
    public interface ITransactionService
    {
        Task<TransactionResponse> CreateTransactionAsync(CreateTransactionRequest request, Guid userId);
        Task<DataTableResponse<TransactionResponse>> GetFilteredTransactionsByUserIdAsync(Guid userId, DataTableRequest? request = null);
        Task<List<TransactionResponse>> GetAllTransactionsByUserIdAsync(Guid userId);
        Task DeleteTransactionByIdAsync(Guid transactionId, Guid userId);
        Task<TransactionResponse> EditTransactionByIdAsync(Guid transactionId, decimal newAmount, Guid userId);
        Task<TransactionResponse> GetTransactionByIdAsync(Guid transactionId, Guid userId);
    }
}
