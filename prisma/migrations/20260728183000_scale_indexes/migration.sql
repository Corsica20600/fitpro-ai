-- Reduce sort/scan work on the high-traffic workout, watch, and exercise catalog paths.
CREATE INDEX "Exercise_isActive_name_idx" ON "Exercise"("isActive", "name");
CREATE INDEX "Exercise_isActive_category_name_idx" ON "Exercise"("isActive", "category", "name");

CREATE INDEX "ProgramExercise_programDayId_exerciseId_idx" ON "ProgramExercise"("programDayId", "exerciseId");

CREATE INDEX "WorkoutSession_userProfileId_status_endedAt_createdAt_idx" ON "WorkoutSession"("userProfileId", "status", "endedAt", "createdAt");
CREATE INDEX "WorkoutSession_userProfileId_programDayId_status_idx" ON "WorkoutSession"("userProfileId", "programDayId", "status");

CREATE INDEX "WorkoutSet_workoutSessionId_exerciseId_setIndex_createdAt_idx" ON "WorkoutSet"("workoutSessionId", "exerciseId", "setIndex", "createdAt");
CREATE INDEX "WorkoutSet_workoutSessionId_exerciseId_completedAt_createdAt_idx" ON "WorkoutSet"("workoutSessionId", "exerciseId", "completedAt", "createdAt");
CREATE INDEX "WorkoutSet_exerciseId_completedAt_createdAt_idx" ON "WorkoutSet"("exerciseId", "completedAt", "createdAt");
