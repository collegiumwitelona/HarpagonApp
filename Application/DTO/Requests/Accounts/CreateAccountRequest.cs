namespace Application.DTO.Requests.Accounts
{
    /// <summary>
    /// Request model used to create a new account.
    /// </summary>
    public class CreateAccountRequest
    {
        /// <summary>
        /// Name of the account.
        /// </summary>
        public string AccountName { get; set; }
        /// <summary>
        /// Initial balance assigned to the account.
        /// </summary>
        public decimal InitialBalance { get; set; }
        /// <summary>
        /// Target goal value for the account.
        /// </summary>
        public decimal InitialGoal { get; set; }
    }
}
