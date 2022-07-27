export const TopBar = ({ text, setText, onEnterClick }) => {
  const onChange = (e) => setText(e.target.value);

  const onKeyPress = (e) => {
    const isEnter = e.key === 'Enter';
    if (isEnter) onEnterClick();
  };

  return (
    <div className="top-bar">
      <input
        className="top-bar_input ellipsis"
        type="text"
        value={text}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder="New todo"
      />
    </div>
  );
};
