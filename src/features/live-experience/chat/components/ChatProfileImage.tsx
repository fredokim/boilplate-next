import Image from "next/image";
import styles from "../../views/LiveExperience.module.scss";

type ChatProfileImageProps = {
  displayName: string;
  src: string;
};

export function ChatProfileImage({ displayName, src }: ChatProfileImageProps) {
  return <Image alt={`${displayName}'s profile`} className={styles.profile} height={36} src={src} width={36} />;
}
