namespace Application.DTO.Requests.Accounts;

/// <summary>
/// Request model used to update an account goal.
/// </summary>
public class EditAccountGoalRequest
{
    /// <summary>
    /// Identifier of the account to update.
    /// </summary>
    public Guid AccountId { get; set; }
    /// <summary>
    /// New goal value for the account.
    /// </summary>
    public decimal NewGoal { get; set; }
}