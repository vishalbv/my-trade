import AppIcon from "../../icons/appIcon";

const AppLogo = ({ logo = true }: { logo?: boolean }) => {
  return (
    <div className="flex items-center whitespace-nowrap ml-2">
      <AppIcon width={26} height={26} />
      {logo && (
        <span className="ml-2 text-lg font-bold text-nav-foreground font-oleo-script mt-1">
          MY-TRADE
        </span>
      )}
    </div>
  );
};

export default AppLogo;
