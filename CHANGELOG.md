# Changelog

Changelog for NeoFS Panel

## [Unreleased]

## [0.5.2] - 2024-04-15

### Added
- Wallet installation instructions (#198)
- "Hosted on NeoFS" (#203)
- Container creation cost message (#204)
- OneGate instructions (#207)

### Fixed
- Missing restrictions for "allow reads for others" EACL preset (#201)
- "Share" link text for open containers (#202)
- Incorrect background (#206)

### Changed
- Filter/rule addition button placement (#200)
- WalletConnect popup to in-page modal screen (#205)

## [0.5.1] - 2024-03-20

### Fixed
- Link to share objects was incompatible with NeoFS hosting (#180)
- Confusing duplication of links to access object with/without token (#181)

### Changed
- Minor UI optimizations (#184)

## [0.5.0] - 2024-03-18

### Added
- OneGate wallet support (#161)
- NeoLine wallet support (#164)
- O3 wallet support (#166)
- Wallet selector (#171)
- Pagination for object list (#172)
- Object sharing via link (#173)

### Fixed
- Error on mainnet balance update (#163)
- Design for mobile browsers (#168)
- Error messsage for disconnected wallet (#170)

### Changed
- Single bearer token for object operations is used now (#157)
- Account panel was redesigned (#167)

## [0.4.0] - 2024-02-09

### Added
- REACT_APP_NETWORK configuration (#130)
- Download button for objects (#137)

### Fixed
- Add profile.html in Makefile (#119)
- Missing error handling in some cases (#139, #153, #155)
- Displaying long file names (#139)

### Changed
- UI texts and icons for better experience (#129, #140, #142, #150, #151)
- Upgraded WalletConnect SDK to 3.2.0 (#138)
- EACL presets to Panel-compatible (#147)

### Removed
- Useless REACT_APP_NEOFS_GAS_TOKEN configuration (#128)
- Duplicating REACT_APP_NEOFS_SCRIPT_HASH configuration (#131)
- Dependency on HTTP gateway (#125, #150)

## [0.3.1] - 2023-12-25

### Fixed
- Add profile.html in Makefile (#119)

## [0.3.0] - 2023-12-25

### Fixed
- Incompatibility with new WC version (#112)

### Changed
- Use mainnet by default (#116)

## [0.2.1] - 2023-10-18

### Fixed
- Improve Makefile (#84, #96)
- Replace WorkSans font (#89)
- Break long file names in label (#91)
- Remove vulnerabilities from package.json (#95)
- Implement social_pipe for socials list (#98)
- Hide webpack source map (#100)

### Added
- Website version to the page (#63)

### Changed
- Implement neo design (#89)
- Social links for new format (#97)
- WC sdk react lib for node 18 version (#103)

## [0.2.0] - 2022-11-23

### Fixed
- WalletConnect options (#85)
- Assets withdraw (#38)
- Logout on bad websocket connection (#79)

### Added
- Gateway token storage (#15)
- Loader for object list (#80)
- Connection issue messages (#40)

### Changed
- Containers order (#49)
- Token lifetime (#23)

## [0.1.0] - 2022-11-01

First public review release.


[0.1.0]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.1.0
[0.2.0]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.2.0
[0.2.1]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.2.1
[0.3.0]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.3.0
[0.3.1]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.3.1
[0.4.0]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.4.0
[0.5.0]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.5.0
[0.5.1]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.5.1
[0.5.2]: https://github.com/nspcc-dev/panel-fs-neo-org/tree/v0.5.2
[Unreleased]: https://github.com/nspcc-dev/panel-fs-neo-org/compare/v0.5.2...master
