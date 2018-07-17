const p2p = artifacts.require("PredictionHandshake")

const l = console.log
const eq = assert.equal
const neq = assert.notEqual
const as = assert

const u = require('./util.js')
const b2s = u.b2s
const s2b = u.s2b
const s2ba = u.s2ba
const b2sa = u.b2sa
const oc = u.oc
const poc = u.poc
const paoc = u.paoc
const ca = u.ca

contract("PredictionHandshake", (accounts) => {

        const root = accounts[0]
        const creator1 = accounts[1]
        const creator2 = accounts[2]
        const maker1 = accounts[3]
        const maker2 = accounts[4]
        const maker3 = accounts[5]
        const taker1 = accounts[6]
        const taker2 = accounts[7]
        const taker3 = accounts[8]
        const reporter1 = accounts[9]

        const DRAW = 3, SUPPORT = 1, AGAINST = 2
        const OFFCHAIN = 1

        let hs;

        before(async () => {
                hs = await p2p.deployed();
        })

        describe('create two prediction markets', () => {

                it('should create the 1st prediction market', async () => {
                        const i = {
                                fee: 2,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator1 
                        }
                        const o = {
                                hid: 0
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})

                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

                it('should create the 2nd prediction market', async () => {
                        const i = {
                                fee: 1,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator2 
                        }
                        const o = {
                                hid: 1
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})

                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

        })

        describe('init/make orders', () => {

                it("should init/make 1st order", async () => {
                        const i = {
                                hid: 1,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker1 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                        // eq(o.payout, await oc(tx, "__test__init", "payout"))
                })

                it("should init/make 2nd order", async () => {
                        const i = {
                                hid: 1,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker1 
                        }
                        const o = {
                                stake: i.stake * 2,
                                payout: i.stake * 2 * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                        // eq(o.payout, await oc(tx, "__test__init", "payout"))
                })

                it("should init/make 3rd order", async () => {
                        const i = {
                                hid: 1,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                odds: 400,
                                sender: maker2 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                        // eq(o.payout, await oc(tx, "__test__init", "payout"))
                })

                it("should uninit/cancel 3rd order", async () => {
                        const i = {
                                hid: 1,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                odds: 400,
                                sender: maker2 
                        }
                        const o = {
                                stake: 0,
                                payout: 0
                        }
                        const tx = await hs.uninit(i.hid, i.side, i.stake, i.odds, OFFCHAIN, {from: i.sender})
                        eq(o.stake, await oc(tx, "__test__uninit", "stake"))
                        // eq(o.payout, await oc(tx, "__test__uninit", "payout"))
                })

                it("should init/make the 4th order", async () => {
                        const i = {
                                hid: 1,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker1 
                        }
                        const o = {
                                stake: i.stake * 3,
                                payout: i.stake * 3 * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                        // eq(o.payout, await oc(tx, "__test__init", "payout"))
                })

        })

        describe('place take orders', () => {

                it("should place 1st take order (exact matched)", async () => {
                        const i = {
                                hid: 1,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                takerOdds: 150,
                                makerOdds: 300,
                                maker: maker1,
                                sender: taker1 
                        }
                        const o = {
                                match_taker_stake: i.stake,
                                match_taker_payout: i.stake * i.takerOdds / 100,
                                match_maker_stake: web3.toWei(0.1),
                                match_maker_payout: web3.toWei(0.3),
                                open_maker_stake: web3.toWei(0.2),
                                open_maker_payout: web3.toWei(0.6)
                        }
                        const tx = await hs.shake(i.hid, i.side, i.takerOdds, i.maker, i.makerOdds, OFFCHAIN, {from: i.sender, value: i.stake})

                        eq(o.match_taker_stake, await oc(tx, "__test__shake__taker__matched", "stake"))
                        eq(o.match_taker_payout, await oc(tx, "__test__shake__taker__matched", "payout"))

                        eq(o.match_maker_stake, await oc(tx, "__test__shake__maker__matched", "stake"))
                        eq(o.match_maker_payout, await oc(tx, "__test__shake__maker__matched", "payout"))

                        eq(o.open_maker_stake, await oc(tx, "__test__shake__maker__open", "stake"))
                        // eq(o.open_maker_payout, await oc(tx, "__test__shake__maker__open", "payout"))

                })

                it("should place 2nd take order (not exact matched)", async () => {
                        const i = {
                                hid: 1,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                takerOdds: 120,
                                makerOdds: 300,
                                maker: maker1,
                                sender: taker2 
                        }
                        const o = {
                                match_taker_stake: i.stake,
                                match_taker_payout: i.stake * i.takerOdds / 100,
                                match_maker_stake: web3.toWei(0.14), // 0.24 - 0.2 + 0.1
                                match_maker_payout: web3.toWei(0.54),
                                open_maker_stake: web3.toWei(0.16),
                                open_maker_payout: web3.toWei(0.24)
                        }
                        const tx = await hs.shake(i.hid, i.side, i.takerOdds, i.maker, i.makerOdds, OFFCHAIN, {from: i.sender, value: i.stake})

                        eq(o.match_taker_stake, await oc(tx, "__test__shake__taker__matched", "stake"))
                        eq(o.match_taker_payout, await oc(tx, "__test__shake__taker__matched", "payout"))

                        eq(o.match_maker_stake, await oc(tx, "__test__shake__maker__matched", "stake"))
                        eq(o.match_maker_payout, await oc(tx, "__test__shake__maker__matched", "payout"))

                        eq(o.open_maker_stake, await oc(tx, "__test__shake__maker__open", "stake"))
                        // eq(o.open_maker_payout, await oc(tx, "__test__shake__maker__open", "payout"))

                })
        })

        describe('collect payouts', () => {

                it("should not be able to collect payout (no report yet)", async () => {
                        const i = {
                                hid: 1,
                                trader: maker1
                        }
                        await u.assertRevert(hs.collect(i.hid, OFFCHAIN, {from: i.trader}))
                })
        })


        describe('report outcome', () => {

                it("should not be able to report outcome (not a reporter)", async () => {
                        const i = {
                                hid: 1,
                                reporter: maker1
                        }
                        await u.assertRevert(hs.report(i.hid, SUPPORT, OFFCHAIN, {from: i.reporter}))
                })

                it("should report outcome", async () => {
                        const i = {
                                hid: 1,
                                reporter: creator2
                        }

                        u.increaseTime(10)

                        const tx = await hs.report(i.hid, SUPPORT, OFFCHAIN, {from: i.reporter})

                })
        })

        describe('collect payouts', () => {

                it("should collect payout (report is now available)", async () => {
                        const i = {
                                hid: 1,
                                trader: maker1
                        }
                        const o = {
                                marketComm: web3.toWei(.0054 * .8),
                                networkComm: web3.toWei(.0054 * .2),
                                payout: web3.toWei(0.6946) //0.54 + 0.16 - 0.0054 
                        }
                        u.increaseTime(20)

                        const tx = await hs.collect(i.hid, OFFCHAIN, {from: i.trader})
                        eq(o.networkComm, await oc(tx, "__test__collect", "network"))
                        eq(o.marketComm, await oc(tx, "__test__collect", "market"))
                        eq(o.payout, await oc(tx, "__test__collect", "trader"))
                })
        })

        describe('user story: refund (no report and expired)', () => {

                it('should create the 3rd prediction market', async () => {
                        const i = {
                                fee: 1,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator2 
                        }
                        const o = {
                                hid: 2
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})

                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

                it("should init/make the 5th order", async () => {
                        const i = {
                                hid: 2,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker2 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                })

                it("should not refund (still within report window)", async () => {
                        const i = {
                                hid: 2,
                                trader: maker2
                        }
                        await u.assertRevert(hs.refund(i.hid, OFFCHAIN, {from: i.trader}))
                })

                it("should refund", async () => {
                        const i = {
                                hid: 2,
                                trader: maker2
                        }
                        const o = {
                                amt: web3.toWei(0.1)
                        }

                        u.increaseTime(60)

                        const tx = await hs.refund(i.hid, OFFCHAIN, {from: i.trader})
                        eq(o.amt, await oc(tx, "__test__refund", "amt"))
                })

        })

        describe("uninit for trial", async() => {
                it('create a brand new market', async() => {
                        const i = {
                                fee: 0,
                                source: s2b("livescore.com"),
                                closingWindow: 1000,
                                reportWindow: 2000,
                                disputeWindow: 3000,
                                creator: creator1 
                        }
                        const o = {
                            hid: 3
                        }
        
                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})

                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                });

                it('should be able to init test drive', async() => {
                        const i = {
                                hid: 3,
                                side: SUPPORT,
                                odds: 100,
                                stake: web3.toWei(1, 'ether'),
                                maker: maker3,
                                creator: creator1
                        }
        
                        const tx = await hs.initTestDrive(i.hid, i.side, i.odds, i.maker, OFFCHAIN, { from: root, value: i.stake })
                        const trial = await hs.getOpenData(i.hid, i.side, i.maker, i.odds);
        
                        eq(web3.toWei(1, 'ether'), trial[0].toNumber())
                        eq(web3.toWei(1, 'ether'), await oc(tx, "__test__init", "stake"))    
                });

                it('should be able to uninit for trial', async() => {
                        const i = {
                                hid: 3,
                                side: SUPPORT,
                                odds: 100,
                                maker: maker3,
                                value: web3.toWei(1, 'ether')
                        }
                      
                        const tx = await hs.uninitTestDrive(i.hid, i.side, i.odds, i.maker, i.value, OFFCHAIN, { from: root })
        
                        const total = await hs.total()
                        const trial = await hs.getOpenData(i.hid, i.side, i.maker, i.odds);
        
                        assert.equal(web3.toWei(1, 'ether'), total)
                        assert.equal(0, trial[0].toNumber())
                });

                it('root is able to withdraw ether from trial total', async() => {
                        const total = await hs.total()
                        const rootBalanceBefore = await web3.eth.getBalance(root)
        
                        const tx = await hs.withdrawTrial({ from: root });
                        const rootBalanceAfter = await web3.eth.getBalance(root)
        
                        const expected = (rootBalanceBefore.toNumber() + total.toNumber()) / 10**18
        
                        const realValue = rootBalanceAfter.toNumber() / 10**18
        
                        assert.equal(Math.floor(expected), Math.floor(realValue))
        
                        const totalAfter = await hs.total()
        
                        assert.equal(0, totalAfter.toNumber())
                });
        });

        describe('dispute function', async() => {
                it('create a market', async() => {
                        const i = {
                                fee: 0,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator1 
                        }
                        const o = {
                            hid: 4
                        }
        
                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})
        
                        assert.equal(o.hid, await oc(tx, "__createMarket", "hid"))
                });

                it("maker1 places an order", async () => {
                        const i = {
                                hid: 4,
                                side: SUPPORT, 
                                stake: web3.toWei(2, 'ether'),
                                odds: 300,
                                sender: maker1 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                });

                it("taker1 fills maker1's order", async() => {
                        const i = {
                                hid: 4,
                                side: AGAINST,
                                taker: taker1,
                                takerOdds: 150,
                                value: web3.toWei('4', 'ether'),
                                maker: maker1,
                                makerOdds: 300
                        }
                        const o = {
                                match_taker_stake: i.value,
                                match_taker_payout: i.value * i.takerOdds / 100,
                                match_maker_stake: web3.toWei(2, 'ether'),
                                match_maker_payout: web3.toWei(2, 'ether') * i.makerOdds / 100,
                                open_maker_stake: web3.toWei(0)
                        }
                        const tx = await hs.shake(i.hid, i.side, i.takerOdds, i.maker, i.makerOdds, OFFCHAIN, { from: i.taker, value: i.value });
                        
                        assert.equal(o.match_taker_stake, await oc(tx, "__test__shake__taker__matched", "stake"))
                        assert.equal(o.match_taker_payout, await oc(tx, "__test__shake__taker__matched", "payout"))
        
                        assert.equal(o.match_maker_stake, await oc(tx, "__test__shake__maker__matched", "stake"))
                        assert.equal(o.match_maker_payout, await oc(tx, "__test__shake__maker__matched", "payout"))
        
                        assert.equal(o.open_maker_stake, await oc(tx, "__test__shake__maker__open", "stake"))
                });

                it('creator reports an outcome on the order', async () => {
                        const i = {
                                hid: 4,
                                creator: creator1,
                                outcome: 2
                        }

                        const o = {
                                outcome: 2
                        }
                
                        await hs.report(i.hid, i.outcome, OFFCHAIN, { from: i.creator });
        
                        var marketState = await hs.markets(4, { from: root });
        
                        assert.equal(o.outcome, marketState[7].toNumber())
                });

                it('maker1 disputes the outcome', async () => {
                        const i = {
                                hid: 4
                        }
                
                        const o = {
                                totalDisputeStake: web3.toWei(2, 'ether')
                        }

                        const tx = await hs.dispute(i.hid, OFFCHAIN, { from: maker1 });
        
                        const marketState = await hs.markets(4, { from: root });
        
                        assert.equal(o.totalDisputeStake, marketState[10].toNumber())
                });

                it('root resolves the dispute', async() => {
                        const i = {
                                hid: 4,
                                outcome: 1
                        }

                        const o = {
                                state: 2,
                                outcome: 1
                        }
        
                        const tx = await hs.resolve(i.hid, i.outcome, OFFCHAIN, { from: root });
                        const marketState = await hs.markets(4, { from: root });
                        
                        assert.equal(o.outcome, marketState[7].toNumber());
                        assert.equal(o.state, marketState[6].toNumber());
                });
        });


        describe('user story: uninit (report window and i am maker)', () => {

                it('should create the 3rd prediction market', async () => {
                        const i = {
                                fee: 1,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator2 
                        }
                        const o = {
                                hid: 5
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})
                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

                it("init", async () => {
                        const i = {
                                hid: 5,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker2 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                })

                it("should uninit (in report window)", async () => {
                        const i = {
                                hid: 5,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker2,
                                creator: creator2 
                        }
                        const o = {
                                stake: 0,
                                payout: 0
                        }
                        u.increaseTime(60)
                        const tx = await hs.uninit(i.hid, i.side, i.stake, i.odds, OFFCHAIN, {from: i.sender})
                        eq(o.stake, await oc(tx, "__test__uninit", "stake"))
                })
        })

        describe('user story: uninit (report window and i am taker)', () => {

                it('should create the 3rd prediction market', async () => {
                        const i = {
                                fee: 1,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator2 
                        }
                        const o = {
                                hid: 6
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})
                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

                it("init", async () => {
                        const i = {
                                hid: 6,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker2 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                })

                it("shake", async () => {
                        const i = {
                                hid: 6,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                takerOdds: 150,
                                makerOdds: 300,
                                maker: maker2,
                                sender: taker1 
                        }
                        const o = {
                                match_taker_stake: i.stake,
                                match_taker_payout: i.stake * i.takerOdds / 100,
                                match_maker_stake: web3.toWei(0.1),
                                match_maker_payout: web3.toWei(0.3),
                                open_maker_stake: web3.toWei(0.2),
                                open_maker_payout: web3.toWei(0.6)
                        }
                        const tx = await hs.shake(i.hid, i.side, i.takerOdds, i.maker, i.makerOdds, OFFCHAIN, {from: i.sender, value: i.stake})
                })

                it("shouldn't uninit (in report window and i am taker)", async () => {
                        const i = {
                                hid: 6,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                odds: 150,
                                sender: taker1
                        }
                        const o = {
                                stake: 0,
                                payout: 0
                        }
                        u.increaseTime(60)
                        await u.assertRevert(hs.uninit(i.hid, i.side, i.stake, i.odds, OFFCHAIN, {from: i.sender}))
                })
        })


        describe('user story: refund (> report window and outcome is draw)', () => {

                it('should create the 3rd prediction market', async () => {
                        const i = {
                                fee: 1,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator2 
                        }
                        const o = {
                                hid: 7
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})
                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

                it("init", async () => {
                        const i = {
                                hid: 7,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker2 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                })

                it("shake", async () => {
                        const i = {
                                hid: 7,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                takerOdds: 150,
                                makerOdds: 300,
                                maker: maker2,
                                sender: taker1 
                        }
                        const o = {
                                match_taker_stake: i.stake,
                                match_taker_payout: i.stake * i.takerOdds / 100,
                                match_maker_stake: web3.toWei(0.1),
                                match_maker_payout: web3.toWei(0.3),
                                open_maker_stake: web3.toWei(0.2),
                                open_maker_payout: web3.toWei(0.6)
                        }
                        const tx = await hs.shake(i.hid, i.side, i.takerOdds, i.maker, i.makerOdds, OFFCHAIN, {from: i.sender, value: i.stake})
                })

                it("report outcome (draw)", async () => {
                        const i = {
                                hid: 7,
                                outcome: DRAW, 
                                creator: creator2
                        }
                        u.increaseTime(10)
                        await hs.report(i.hid, i.outcome, OFFCHAIN, { from: i.creator });
                })

                it("should refund", async () => {
                        const i = {
                                hid: 7,
                                outcome: DRAW,
                                sender: taker1,
                                creator: creator2
                        }
                        const o = {
                                payout: web3.toWei(0.2)
                        }
                        u.increaseTime(20)
                        const tx = await hs.refund(i.hid, OFFCHAIN, {from: i.sender})
                        eq(o.payout, await oc(tx, "__test__refund", "amt"))
                })
        })


        describe('user story: refund (use both free bet and real bet)', () => {

                it('should create the 3rd prediction market', async () => {
                        const i = {
                                fee: 1,
                                source: s2b("livescore.com"),
                                closingWindow: 10,
                                reportWindow: 10,
                                disputeWindow: 10,
                                creator: creator1 
                        }
                        const o = {
                                hid: 8
                        }

                        const tx = await hs.createMarket(i.fee, i.source, i.closingWindow, i.reportWindow, i.disputeWindow, OFFCHAIN, { from: i.creator})
                        eq(o.hid, await oc(tx, "__createMarket", "hid"))
                })

                it("init", async () => {
                        const i = {
                                hid: 8,
                                side: SUPPORT, 
                                stake: web3.toWei(0.1),
                                odds: 300,
                                sender: maker2 
                        }
                        const o = {
                                stake: i.stake,
                                payout: i.stake * i.odds / 100
                        }
                        const tx = await hs.init(i.hid, i.side, i.odds, OFFCHAIN, {from: i.sender, value: i.stake})
                        eq(o.stake, await oc(tx, "__test__init", "stake"))
                })

                it('should be able to init test drive', async() => {
                        const i = {
                                hid: 8,
                                side: SUPPORT,
                                odds: 100,
                                stake: web3.toWei(0.001, 'ether'),
                                maker: maker2,
                                creator: creator1
                        }
        
                        const tx = await hs.initTestDrive(i.hid, i.side, i.odds, i.maker, OFFCHAIN, { from: root, value: i.stake })
                        const trial = await hs.getOpenData(i.hid, i.side, i.maker, i.odds);
        
                        eq(web3.toWei(0.1 + 0.001, 'ether'), trial[0].toNumber())
                        eq(web3.toWei(0.1 + 0.001, 'ether'), await oc(tx, "__test__init", "stake"))    
                });

                it("shake", async () => {
                        const i = {
                                hid: 8,
                                side: AGAINST, 
                                stake: web3.toWei(0.2),
                                takerOdds: 150,
                                makerOdds: 300,
                                maker: maker2,
                                sender: taker1 
                        }
                        const o = {
                                match_taker_stake: i.stake,
                                match_taker_payout: i.stake * i.takerOdds / 100,
                                match_maker_stake: web3.toWei(0.1),
                                match_maker_payout: web3.toWei(0.3),
                                open_maker_stake: web3.toWei(0.2),
                                open_maker_payout: web3.toWei(0.6)
                        }
                        const tx = await hs.shake(i.hid, i.side, i.takerOdds, i.maker, i.makerOdds, OFFCHAIN, {from: i.sender, value: i.stake})
                })

                it("report outcome (draw)", async () => {
                        const i = {
                                hid: 8,
                                outcome: DRAW, 
                                creator: creator1
                        }
                        u.increaseTime(10)
                        await hs.report(i.hid, i.outcome, OFFCHAIN, { from: i.creator });
                })

                it("should refund", async () => {
                        const i = {
                                hid: 8,
                                sender: maker2,
                                creator: creator1
                        }
                        const o = {
                                payout: web3.toWei(0.1)
                        }
                        u.increaseTime(20)
                        const tx = await hs.refund(i.hid, OFFCHAIN, {from: i.sender})
                        eq(o.payout, await oc(tx, "__test__refund", "amt").toNumber())
                })
        })

})
