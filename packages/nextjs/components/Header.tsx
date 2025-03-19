"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BugAntIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { useTheme } from "next-themes";
import { Modal } from "~~/components/scaffold-eth/Modal";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "VR展厅",
    href: "/wasee3D_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "3D模型",
    href: "/model3D_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFTs盲盒",
    href: "/boxNFTs_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFTs拍卖",
    href: "/auctionNFTs_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFTs市场",
    href: "/marketNFTs_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFTs碎片化",
    href: "/fragmentNFTs_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "空投奖励",
    href: "/airdropNFTs_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "我的收藏",
    href: "/myFavorite_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "我的NFTs",
    href: "/listNFTs_llq",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "铸造NFTs",
    href: "/mintNFTs_llq",
    icon: <ArrowUpTrayIcon className="h-4 w-4" />,
  },

  // {
  //   label: "My NFTs",
  //   href: "/myNFTs",
  //   icon: <PhotoIcon className="h-4 w-4" />,
  // },
  // {
  //   label: "Transfers",
  //   href: "/transfers",
  //   icon: <ArrowPathIcon className="h-4 w-4" />,
  // },
  // {
  //   label: "IPFS Upload",
  //   href: "/ipfsUpload",
  //   icon: <ArrowUpTrayIcon className="h-4 w-4" />,
  // },
  // {
  //   label: "IPFS Download",
  //   href: "/ipfsDownload",
  //   icon: <ArrowDownTrayIcon className="h-4 w-4" />,
  // },

  // {
  //   label: "Create NFTs",
  //   href: "/createNFTs",
  //   icon: <BugAntIcon className="h-4 w-4" />,
  // },

  // {
  //   label: "History",
  //   href: "/history",
  //   icon: <ArrowPathIcon className="h-4 w-4" />,
  // },
  // {
  //   label: "调试合约",
  //   href: "/debug",
  //   icon: <BugAntIcon className="h-4 w-4" />,
  // },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { address: connectedAddress } = useAccount();

  const { data: nftBalance } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
  });

  const handle3DGalleryClick = async (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    
    if (!connectedAddress) {
      setModalConfig({
        title: '请先连接钱包',
        message: '体验VR展厅需要先连接您的钱包',
        confirmText: '好的',
        cancelText: '',
        onConfirm: () => {},
      });
      setShowModal(true);
      return;
    }

    if (!nftBalance || parseInt(nftBalance.toString()) === 0) {
      setModalConfig({
        title: '无法访问VR展厅',
        message: '请先加入我们，购买或铸造NFT再进入展厅吧~',
        confirmText: '去铸造',
        cancelText: '取消',
        onConfirm: () => router.push('/mintNFTs_llq'),
      });
      setShowModal(true);
      return;
    }

    router.push(href);
  };

  return (
    <>
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
      />
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${isActive ? "bg-white/20 shadow-md" : ""
                } hover:bg-white/30 hover:shadow-lg focus:!bg-white/20 active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col transition-all duration-300 backdrop-blur-sm`}
              onClick={(e) => label === "VR展厅" ? handle3DGalleryClick(e, href) : undefined}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <>
      <div
        className="fixed top-0 left-0 w-full h-4 z-50"
        onMouseEnter={() => setIsVisible(true)}
      />
      <div
        className={`fixed top-0 left-0 w-full transition-transform duration-300 ease-in-out z-50 ${isVisible ? "transform translate-y-0" : "transform -translate-y-full"
          }`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <div className={`navbar backdrop-blur-md transition-all duration-300
          ${resolvedTheme === "dark"
            ? "bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 text-white"
            : "bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30"
          } min-h-0 flex-shrink-0 justify-between shadow-lg px-0 sm:px-2`}
        >
          <div className="navbar-start w-auto xl:w-1/2">
            <div className="xl:hidden dropdown" ref={burgerMenuRef}>
              <label
                tabIndex={0}
                className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
                onClick={() => {
                  setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
                }}
              >
                <Bars3Icon className="h-1/2" />
              </label>
              {isDrawerOpen && (
                <ul
                  tabIndex={0}
                  className={`menu menu-compact dropdown-content mt-3 p-2 shadow rounded-box w-52 
                    ${resolvedTheme === "dark"
                      ? "bg-base-200 text-white"
                      : "bg-base-100"
                    }`}
                  onClick={() => {
                    setIsDrawerOpen(false);
                  }}
                >
                  <HeaderMenuLinks />
                </ul>
              )}
            </div>
            <Link href="/" passHref className="hidden xl:flex items-center gap-1 ml-4 mr-6 shrink-0 transition-transform hover:scale-105">
              <div className="flex relative w-10 h-10 rounded-full overflow-hidden">
                <Image alt="SE2 logo" className="cursor-pointer transform hover:scale-110 transition-transform duration-300" fill src="/zoulu01.gif" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">数字藏品</span>
                <span className="text-xs text-gray-600">Shu Zi Cang Pin</span>
              </div>
            </Link>
            <ul className="hidden xl:flex xl:flex-nowrap menu menu-horizontal px-1 gap-2">
              <HeaderMenuLinks />
            </ul>
          </div>
          <div className="navbar-end flex-grow mr-4">
            <RainbowKitCustomConnectButton />
            <FaucetButton />
          </div>
        </div>
      </div>
    </>
  );
};

