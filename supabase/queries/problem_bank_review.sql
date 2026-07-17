-- Problem-bank trust review (run ad hoc in the Supabase SQL Editor).
--
-- Architecture decision (Tier 0, July 2026): answer checking is client-side and
-- answers ship in the public bundle/repo. Auto-solvers are tolerated — the only
-- thing we defend is the crowd-verification SIGNAL, by filtering anomalous
-- accounts here at review time. Revisit (move answers server-side behind a
-- check_answer RPC) before ever adding leaderboards or public solved-badges.

-- Accounts whose solve pattern looks automated: high volume, near-perfect,
-- inhumanly fast. Tune thresholds as real usage data accumulates.
with attempts as (
  select
    user_id,
    meta->>'problemId' as problem_id,
    score,
    created_at,
    created_at - lag(created_at) over (partition by user_id order by created_at) as gap
  from drill_attempts
  where drill = 'probability' and meta ? 'problemId'
),
suspicious as (
  select user_id
  from attempts
  group by user_id
  having count(*) >= 10
     and avg(score) > 0.95                                       -- never wrong
     and percentile_cont(0.5) within group (order by extract(epoch from gap))
         < 20                                                    -- median <20s between solves
)

-- Trust table: solves from organic accounts vs. flags, per problem.
-- High correct_solves + zero flags => candidate for "verified"; any flags =>
-- re-check that problem's parsing/answer.
select
  a.problem_id,
  count(*) filter (where a.score = 1)                            as correct_solves,
  count(distinct a.user_id) filter (where a.score = 1)           as distinct_solvers,
  (select count(*) from problem_flags f
    where f.problem_id = a.problem_id)                           as flags
from attempts a
where a.user_id not in (select user_id from suspicious)
group by a.problem_id
order by flags desc, distinct_solvers asc;
