import AppIcon from "../../icons/appIcon";

const AppLogo = () => {
  return (
    <div className="flex items-center whitespace-nowrap">
      <AppIcon width={30} height={30} />
      <span className="ml-2 text-xl font-bold text-nav-foreground font-oleo-script mt-1">
        MY-TRADE
      </span>
    </div>
  );
};

export default AppLogo;
