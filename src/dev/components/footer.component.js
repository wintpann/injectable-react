import { FILTER } from '../const';

export const Footer = ({ filter, setFilter }) => {
  const onChange = (e) => setFilter(e.target.value);

  return (
    <div className="footer">
      <input
        id="label-all"
        type="radio"
        name="filter"
        value={FILTER.ALL}
        onChange={onChange}
        checked={filter === FILTER.ALL}
      />
      <label className="footer_label" htmlFor="label-all">
        All
      </label>
      <input
        id="label-checked"
        type="radio"
        name="filter"
        value={FILTER.CHECKED}
        onChange={onChange}
        checked={filter === FILTER.CHECKED}
      />
      <label className="footer_label" htmlFor="label-checked">
        Done
      </label>
      <input
        id="label-unchecked"
        type="radio"
        name="filter"
        value={FILTER.UNCHECKED}
        onChange={onChange}
        checked={filter === FILTER.UNCHECKED}
      />
      <label className="footer_label" htmlFor="label-unchecked">
        Remaining
      </label>
    </div>
  );
};
