"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddPlantModal from "./AddPlantModal";
import SettingsModal from "./SettingsModal";
import ResourcesModal from "./ResourcesModal";
import { SettingsProvider } from "@/lib/SettingsContext";

export default function ShellLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <SettingsProvider>
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenAddPlant={() => setAddPlantOpen(true)}
      />
      <div className="flex-1 w-full md:pl-64 min-h-screen flex flex-col">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        {children}
      </div>
      <AddPlantModal
        isOpen={addPlantOpen}
        onClose={() => setAddPlantOpen(false)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ResourcesModal
        isOpen={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
      />
    </SettingsProvider>
  );
}
