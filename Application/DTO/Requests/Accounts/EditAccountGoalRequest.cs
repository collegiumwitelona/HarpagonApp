using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Accounts;

/// <summary>
/// Request model used to update an account goal.
/// </summary>
public class EditAccountGoalRequest
{
    /// <summary>
    /// Identifier of the account to update.
    /// </summary>
    [Required]
    public required Guid AccountId { get; set; }
    /// <summary>
    /// New goal value for the account.
    /// </summary>
    [Required]
    public required decimal NewGoal { get; set; }
}