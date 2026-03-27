using Application.Interfaces.Infrastructure;
using Infrastructure.Persistence.Context;

namespace Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task ExecuteAsync(Func<Task> operation)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                await operation();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
