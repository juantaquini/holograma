"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiCompass, FiBookOpen, FiBell, FiPlus, FiUser } from "react-icons/fi";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();

  const item = (href: string, label: string, Icon: React.ComponentType<any>) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`${styles["sidebar-item"]} ${active ? styles["sidebar-item-active"] : ""}`}
        title={label}
      >
        <Icon size={22} />
        <span className={styles["sidebar-tooltip"]}>{label}</span>
      </Link>
    );
  };

  return (
    <aside className={styles["sidebar-container"]}>
      <div className={styles["sidebar-top"]}>
        {item("/", "Inicio", FiHome)}
        {item("/explore", "Explorar", FiCompass)}
        {item("/articles", "Artículos", FiBookOpen)}
        <button className={styles["sidebar-item"]} title="Crear">
          <FiPlus size={22} />
          <span className={styles["sidebar-tooltip"]}>Crear</span>
        </button>
        {item("/notifications", "Notificaciones", FiBell)}
      </div>
      <div className={styles["sidebar-bottom"]}>
        {item("/profile/me", "Perfil", FiUser)}
      </div>
    </aside>
  );
}