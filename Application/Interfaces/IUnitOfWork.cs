namespace Application.Interfaces
{
    public interface IUnitOfWork
    {
        public Task ExecuteAsync(Func<Task> operations);
    }
}
