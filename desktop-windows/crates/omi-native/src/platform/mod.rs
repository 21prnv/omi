//! Platform glue — thin helpers over windows-rs shared by the modules above.
//!
//! Keeps raw COM/Win32 initialisation in one place (e.g. CoInitializeEx guards,
//! HSTRING conversions) so audio/screen/rewind don't each re-roll it. Empty on
//! non-Windows; this is purely a home for `#[cfg(windows)]` utilities.

#[cfg(windows)]
pub mod windows {
    //! COM apartment guard + small conversion helpers live here as the Windows
    //! impls fill in. Intentionally minimal until the first native module needs it.
}
