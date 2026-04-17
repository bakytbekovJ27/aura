import WardrobeCollectionPage from '../components/WardrobeCollectionPage';

export default function WardrobePage() {
  return (
    <WardrobeCollectionPage
      kind="wardrobe"
      pageTag="Гардероб"
      title={<>Мой <em>гардероб</em></>}
      subtitle="Храни основные вещи, фильтруй их по категориям и быстро собирай образ."
      emptyIcon="👗"
      emptyTitle="Гардероб пока пуст"
      emptyDesc="Добавь базовые вещи, чтобы ассистент мог подбирать для тебя готовые образы."
      addLabel="+ Добавить вещь"
    />
  );
}
