using System.ComponentModel.DataAnnotations;

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
        [Required]
        public required Guid AccountId { get; set; }
        /// <summary>
        /// New balance value for the account.
        /// </summary>
        [Required]
        public required decimal NewBalance { get; set; }
    }
}
