namespace Application.DTO.Requests.Accounts
{
    /// <summary>
    /// Request model used to update an account balance.
    /// </summary>
    public class EditAccountRequest
    {
        /// <summary>
        /// Identifier of the account to update.
        /// </summary>
        public Guid AccountId { get; set; }
        /// <summary>
        /// New balance value for the account.
        /// </summary>
        public decimal NewBalance { get; set; }
    }
}
