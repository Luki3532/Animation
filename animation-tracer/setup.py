#!/usr/bin/env python3
"""
FrameForge Setup Script
=======================
This script helps you set up the FrameForge animation tracer on a new machine.
It checks for Node.js, installs it if needed, and sets up the project.

Usage:
    python setup.py           # Interactive setup
    python setup.py --install # Auto-install Node.js if missing
    python setup.py --run     # Install deps and run dev server
"""

import subprocess
import sys
import os
import platform
import urllib.request
import tempfile
import shutil

# Configuration
REQUIRED_NODE_VERSION = 18
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# Node.js download URLs
NODE_URLS = {
    "Windows": {
        "x64": "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi",
        "arm64": "https://nodejs.org/dist/v20.10.0/node-v20.10.0-arm64.msi"
    },
    "Darwin": {
        "x64": "https://nodejs.org/dist/v20.10.0/node-v20.10.0.pkg",
        "arm64": "https://nodejs.org/dist/v20.10.0/node-v20.10.0.pkg"
    },
    "Linux": {
        "x64": "https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-x64.tar.xz",
        "arm64": "https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-arm64.tar.xz"
    }
}


def print_header():
    """Print welcome header."""
    print("\n" + "=" * 50)
    print("  FrameForge - Animation Tracer Setup")
    print("=" * 50 + "\n")


def print_step(step: str):
    """Print a step message."""
    print(f"[*] {step}")


def print_success(msg: str):
    """Print success message."""
    print(f"[✓] {msg}")


def print_error(msg: str):
    """Print error message."""
    print(f"[✗] {msg}")


def print_info(msg: str):
    """Print info message."""
    print(f"    {msg}")


def get_node_version() -> tuple[bool, str]:
    """Check if Node.js is installed and get version."""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            shell=(platform.system() == "Windows")
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            return True, version
    except FileNotFoundError:
        pass
    return False, ""


def get_npm_version() -> tuple[bool, str]:
    """Check if npm is installed and get version."""
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            shell=(platform.system() == "Windows")
        )
        if result.returncode == 0:
            return True, result.stdout.strip()
    except FileNotFoundError:
        pass
    return False, ""


def parse_version(version_str: str) -> int:
    """Parse major version from version string like 'v20.10.0'."""
    try:
        clean = version_str.lstrip("v").split(".")[0]
        return int(clean)
    except (ValueError, IndexError):
        return 0


def download_file(url: str, dest: str):
    """Download a file with progress."""
    print_info(f"Downloading from {url}")
    
    def progress_hook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = min(100, downloaded * 100 // total_size)
            bar = "█" * (percent // 5) + "░" * (20 - percent // 5)
            print(f"\r    [{bar}] {percent}%", end="", flush=True)
    
    urllib.request.urlretrieve(url, dest, progress_hook)
    print()  # New line after progress


def install_nodejs_windows():
    """Install Node.js on Windows."""
    arch = "arm64" if platform.machine().lower() in ["arm64", "aarch64"] else "x64"
    url = NODE_URLS["Windows"][arch]
    
    with tempfile.TemporaryDirectory() as tmpdir:
        msi_path = os.path.join(tmpdir, "node_installer.msi")
        download_file(url, msi_path)
        
        print_step("Running Node.js installer (this may require admin privileges)...")
        subprocess.run(["msiexec", "/i", msi_path, "/passive"], check=True)
        
    print_success("Node.js installed! Please restart your terminal/command prompt.")
    print_info("After restarting, run this script again to continue setup.")


def install_nodejs_mac():
    """Install Node.js on macOS."""
    # Check for Homebrew first
    brew_exists = shutil.which("brew") is not None
    
    if brew_exists:
        print_step("Installing Node.js via Homebrew...")
        subprocess.run(["brew", "install", "node"], check=True)
    else:
        url = NODE_URLS["Darwin"]["x64"]
        with tempfile.TemporaryDirectory() as tmpdir:
            pkg_path = os.path.join(tmpdir, "node_installer.pkg")
            download_file(url, pkg_path)
            
            print_step("Running Node.js installer (may require password)...")
            subprocess.run(["sudo", "installer", "-pkg", pkg_path, "-target", "/"], check=True)


def install_nodejs_linux():
    """Install Node.js on Linux."""
    # Try package managers first
    if shutil.which("apt"):
        print_step("Installing Node.js via apt...")
        subprocess.run(["sudo", "apt", "update"], check=True)
        subprocess.run(["sudo", "apt", "install", "-y", "nodejs", "npm"], check=True)
    elif shutil.which("dnf"):
        print_step("Installing Node.js via dnf...")
        subprocess.run(["sudo", "dnf", "install", "-y", "nodejs", "npm"], check=True)
    elif shutil.which("pacman"):
        print_step("Installing Node.js via pacman...")
        subprocess.run(["sudo", "pacman", "-S", "--noconfirm", "nodejs", "npm"], check=True)
    else:
        # Manual installation
        arch = "arm64" if platform.machine().lower() in ["arm64", "aarch64"] else "x64"
        url = NODE_URLS["Linux"][arch]
        
        print_info("No package manager found, installing manually...")
        with tempfile.TemporaryDirectory() as tmpdir:
            tar_path = os.path.join(tmpdir, "node.tar.xz")
            download_file(url, tar_path)
            
            print_step("Extracting to /usr/local...")
            subprocess.run(["sudo", "tar", "-xJf", tar_path, "-C", "/usr/local", "--strip-components=1"], check=True)


def install_nodejs():
    """Install Node.js based on the current OS."""
    system = platform.system()
    
    print_step(f"Installing Node.js for {system}...")
    
    if system == "Windows":
        install_nodejs_windows()
    elif system == "Darwin":
        install_nodejs_mac()
    elif system == "Linux":
        install_nodejs_linux()
    else:
        print_error(f"Unsupported operating system: {system}")
        print_info("Please install Node.js manually from https://nodejs.org/")
        return False
    
    return True


def run_npm_install():
    """Run npm install in the project directory."""
    print_step("Installing project dependencies...")
    os.chdir(PROJECT_DIR)
    
    result = subprocess.run(
        ["npm", "install"],
        shell=(platform.system() == "Windows")
    )
    
    if result.returncode == 0:
        print_success("Dependencies installed successfully!")
        return True
    else:
        print_error("Failed to install dependencies")
        return False


def run_dev_server():
    """Start the development server."""
    print_step("Starting development server...")
    print_info("Press Ctrl+C to stop the server")
    print()
    
    os.chdir(PROJECT_DIR)
    subprocess.run(
        ["npm", "run", "dev"],
        shell=(platform.system() == "Windows")
    )


def run_build():
    """Build the project for production."""
    print_step("Building for production...")
    os.chdir(PROJECT_DIR)
    
    result = subprocess.run(
        ["npm", "run", "build"],
        shell=(platform.system() == "Windows")
    )
    
    if result.returncode == 0:
        print_success("Build completed! Output is in the 'dist' folder.")
        return True
    else:
        print_error("Build failed")
        return False


def main():
    print_header()
    
    # Parse arguments
    auto_install = "--install" in sys.argv
    auto_run = "--run" in sys.argv
    build_only = "--build" in sys.argv
    
    # Check Node.js
    print_step("Checking Node.js installation...")
    node_installed, node_version = get_node_version()
    
    if node_installed:
        major_version = parse_version(node_version)
        print_success(f"Node.js {node_version} found")
        
        if major_version < REQUIRED_NODE_VERSION:
            print_error(f"Node.js {REQUIRED_NODE_VERSION}+ is required (you have {node_version})")
            if auto_install or input("    Install newer version? [y/N]: ").lower() == "y":
                install_nodejs()
                return
    else:
        print_error("Node.js is not installed")
        
        if auto_install:
            install_nodejs()
            return
        
        response = input("    Would you like to install Node.js? [y/N]: ")
        if response.lower() == "y":
            install_nodejs()
            return
        else:
            print_info("Please install Node.js from https://nodejs.org/")
            print_info("Then run this script again.")
            return
    
    # Check npm
    print_step("Checking npm installation...")
    npm_installed, npm_version = get_npm_version()
    
    if npm_installed:
        print_success(f"npm {npm_version} found")
    else:
        print_error("npm is not installed (should come with Node.js)")
        return
    
    # Check if node_modules exists
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    if not os.path.exists(node_modules):
        print_step("node_modules not found, installing dependencies...")
        if not run_npm_install():
            return
    else:
        print_success("Dependencies already installed")
        
        # Optionally refresh
        if not auto_run and not build_only:
            response = input("    Reinstall dependencies? [y/N]: ")
            if response.lower() == "y":
                run_npm_install()
    
    print()
    
    # What to do next
    if build_only:
        run_build()
    elif auto_run:
        run_dev_server()
    else:
        print("What would you like to do?")
        print("  1. Start development server")
        print("  2. Build for production")
        print("  3. Exit")
        print()
        
        choice = input("Enter choice [1/2/3]: ").strip()
        
        if choice == "1":
            run_dev_server()
        elif choice == "2":
            run_build()
        else:
            print_success("Setup complete! You can run manually:")
            print_info("  npm run dev    - Start dev server")
            print_info("  npm run build  - Build for production")


if __name__ == "__main__":
    main()
