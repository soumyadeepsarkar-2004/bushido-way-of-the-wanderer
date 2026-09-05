export class StreakSystem {
  constructor() {
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.streakPoints = 0;
    this.streakMultiplier = 1.0;
    this.streakTimeout = 0;
    this.maxTimeout = 8.0; // Seconds to maintain streak between combat actions
  }

  addStreak(amount = 1) {
    this.currentStreak += amount;
    this.streakPoints += amount * 10;
    this.streakTimeout = this.maxTimeout;

    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }

    // Dynamic XP Multiplier calculation
    if (this.currentStreak >= 15) {
      this.streakMultiplier = 3.0;
    } else if (this.currentStreak >= 10) {
      this.streakMultiplier = 2.0;
    } else if (this.currentStreak >= 5) {
      this.streakMultiplier = 1.5;
    } else if (this.currentStreak >= 2) {
      this.streakMultiplier = 1.25;
    } else {
      this.streakMultiplier = 1.0;
    }

    return {
      streak: this.currentStreak,
      multiplier: this.streakMultiplier,
      points: this.streakPoints
    };
  }

  resetStreak() {
    this.currentStreak = 0;
    this.streakMultiplier = 1.0;
  }

  update(delta) {
    if (this.currentStreak > 0) {
      this.streakTimeout -= delta;
      if (this.streakTimeout <= 0) {
        this.resetStreak();
      }
    }
  }

  getMultiplier() {
    return this.streakMultiplier;
  }
}
