# 3C Existing User Migration

Existing installations identified by the legacy launch marker are not forced through new onboarding. When the flag is enabled they enter Main and can establish missing context progressively later. Completed 3C context resumes Main after restart.

Legacy flags default off. Corrupted 3C context is ignored. Authentication state and secure tokens are not rewritten. Guest-to-auth transitions leave the separate non-sensitive context intact.
