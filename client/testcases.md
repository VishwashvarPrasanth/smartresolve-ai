## Test Results

| Check | Test Scenario | Result | Expected / Actual Outcome |
|---|---|---|---|
| 1 | Create a ticket for IT Support | PASS | Ticket `SR-000039` was created. Showed IT Support, P2 priority, and Assigned status. |
| 2 | Check duplicate ticket detection | FAIL (Known Gap) | Ticket was saved, but no duplicate hint was displayed. Duplicate detection is not implemented yet. |
| 3 | Create a separate Facilities ticket for a similar issue | PASS | Ticket `SR-000040` was created with Facilities, P2 priority, and Assigned status. It remained separate from the Wi-Fi ticket and was not merged. |
| 4 | Create a ticket requiring manual review | PASS | Ticket `SR-000042` showed Needs Review status with no assigned owner. |
| 5 | Admin reassigns a ticket | PASS | Admin reassigned `SR-000042` to an admin office staff member. The reassignment reason was recorded in History. |
| 6 | IT staff handles a ticket | PASS | IT staff opened `SR-000039`, moved it to In Progress, added a note, and marked it Resolved. |
| 7 | Reporter closes and reopens tickets | PASS | Reporter A closed `SR-000039` and reopened `SR-000008` with a reason, changing its status to In Progress. Reopening without a reason displayed an error. |
| 8 | Verify overdue ticket tracking | PASS | Overdue tickets displayed red OVERDUE text. The overdue count decreased by one after moving a ticket to In Progress. Overdue counts matched the All Tickets view. |
| 9 | Verify access control and authorization | PASS | Reporter B could not access Reporter A's ticket (Access denied). Reporter A could not access `/admin/analytics` (Access denied). |
| 10 | Verify data persistence, health endpoint, and GitHub | PASS | Data remained available after refreshing the page. `/health` returned `{"status":"ok"}`. The GitHub repository opened and displayed commits. |

### Summary

- **Passed:** 9 checks
- **Failed:** 1 check (duplicate detection — known gap)
- **Total:** 10 checks

**Note:** Check 8's exact overdue counts before and after the status change can be recorded if needed.
