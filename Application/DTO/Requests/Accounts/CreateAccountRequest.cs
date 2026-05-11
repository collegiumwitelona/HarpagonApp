using System.ComponentModel.DataAnnotations;

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
        [Required]
        [MaxLength(60, ErrorMessage = "Account name cannot exceed 60 characters.")]
        public required string AccountName { get; set; }
        /// <summary>
        /// Initial balance assigned to the account.
        /// </summary>
        [Required]
        public required decimal InitialBalance { get; set; }
        /// <summary>
        /// Target goal value for the account.
        /// </summary>
        [Required]
        public required decimal InitialGoal { get; set; }
    }
}
