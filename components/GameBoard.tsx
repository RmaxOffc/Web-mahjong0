// Di komponen game
const { data: userSettings } = useQuery(['userSettings', userId], () => 
  fetch(`/api/user/settings?userId=${userId}`).then(res => res.json())
);

const renderCard = (cardId: string) => {
  const custom = userSettings?.cardCustomization?.[cardId];
  if (custom === null) {
    return <div className="empty-card">Kosong</div>;
  }
  if (custom) {
    return <img src={custom} alt="Custom card" />;
  }
  return <div>Default card {cardId}</div>;
};
