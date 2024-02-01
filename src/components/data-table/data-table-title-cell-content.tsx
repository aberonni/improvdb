import Highlighter from "react-highlight-words";

export const TitleCellContent = ({
  title,
  filter,
}: {
  title: string;
  filter?: string;
}) => (
  <Highlighter
    highlightClassName="bg-yellow-300 dark:bg-yellow-500"
    searchWords={filter ? [filter] : []}
    autoEscape={true}
    textToHighlight={title}
  />
);
