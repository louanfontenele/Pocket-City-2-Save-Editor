import { Link, useLocation } from "react-router-dom";
import { Database, Gamepad2, Home, Save, Settings, Wrench } from "lucide-react";

import { TeamSwitcher } from "@/components/team-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslation } from "@/lib/i18n/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// User info removed per requirements

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const teams = [
    {
      name: t("team.pc2"),
      logo: Gamepad2,
      plan: t("team.pc2Plan"),
    },
    {
      name: t("team.pc1"),
      logo: Gamepad2,
      plan: t("team.pc1Plan"),
      disabled: true,
    },
  ];

  const sections = [
    {
      label: t("sidebar.general"),
      items: [
        { title: t("sidebar.home"), href: "/", icon: Home },
        { title: t("sidebar.saves"), href: "/saves", icon: Save },
      ],
    },
    {
      label: t("sidebar.survival"),
      items: [
        {
          title: t("sidebar.survivalGlobalConfig"),
          href: "/survival-global-config",
          icon: Wrench,
        },
      ],
    },
    {
      label: t("sidebar.maintenance"),
      items: [
        { title: t("sidebar.backups"), href: "/backups", icon: Database },
        { title: t("sidebar.settings"), href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.href}>
                      <Link to={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <LocaleSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
