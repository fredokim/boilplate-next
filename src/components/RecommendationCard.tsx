import type { WorkoutRecommendation } from "@/types/recommendation";
import styles from "./WodPlanner.module.scss";

type RecommendationCardProps = {
  recommendation: WorkoutRecommendation;
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <article className={[styles.resultCard, styles.recommendationCard].join(" ")}>
      <div>
        <p className={styles.eyebrow}>추천</p>
        <h2>{recommendation.type}</h2>
        <h3>{recommendation.title}</h3>
      </div>
      <section>
        <h4>이유</h4>
        <ul>
          {recommendation.reason.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>
      {recommendation.suggestedWorkout ? (
        <section>
          <h4>운동 예시</h4>
          <ol>
            {recommendation.suggestedWorkout.map((workout) => (
              <li key={workout}>{workout}</li>
            ))}
          </ol>
        </section>
      ) : null}
      {recommendation.avoid && recommendation.avoid.length > 0 ? (
        <section>
          <h4>피하기</h4>
          <div className={styles.avoidList}>
            {recommendation.avoid.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
