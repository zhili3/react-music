import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import api from 'api'
import { getSearchSuggest, addSearchHistory, rmSearchHistory } from '../actions/search'
import HistoryList from 'components/historyList/HistoryList'
import TabMenu from 'components/tabMenu/TabMenu'
import Scroll from 'components/scroll/Scroll'
import SongList from 'components/songList/SongList'
import MvList from 'components/mvList/MvList'
import ArtistList from 'components/artistList/ArtistList'
import AlbumList from 'components/albumList/AlbumList'
import PlayList from 'components/playList/PlayList'
import RadioList from 'components/radioList/RadioList'
import Loading from 'components/loading/Loading'
import './search.styl'

class Search extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            probeType: 2,
            keywords: this.props.match.params.keywords || '',
            isSearchResultPage: !!this.props.match.params.keywords,
            loading: false,
            currentIndex: 0,
            tabs: [
                { text: '单曲', type: 1, list: [], count: 0, component: SongList },
                { text: '歌单', type: 1000, list: [], count: 0, component: PlayList, path: '/playlistDetail' },
                { text: '电台', type: 1009, list: [], count: 0, component: RadioList, path: '/radioDetail' },
                { text: '视频', type: 1004, list: [], count: 0, component: MvList },
                { text: '歌手', type: 100, list: [], count: 0, component: ArtistList },
                { text: '专辑', type: 10, list: [], count: 0, component: AlbumList }
            ]
        }
    }

    componentDidMount() {
        this.state.isSearchResultPage && this.loadSearchResult()
    }

    async loadSearchResult() {
        let { keywords, currentIndex, tabs } = this.state
        let offset = tabs[currentIndex].list.length

        if (offset !== 0 && offset >= tabs[currentIndex].count) { // 已经加载完数据
            return
        }

        if (this.isLoading) {
            return
        }

        this.isLoading = true

        this.setState({
            loading: true
        })

        try {
            let res = await api.search({ keywords, type: tabs[currentIndex].type, offset })

            let item = tabs[currentIndex]

            tabs = [...tabs]
            tabs.splice(currentIndex, 1, {
                ...item,
                list: item.list.concat(res.data.searchResult.list),
                count: res.data.searchResult.count
            })

            this.setState({
                tabs: tabs
            })
        } catch (e) {
            console.log(e)
        }

        this.setState({
            loading: false
        })

        this.isLoading = false
    }

    goBack() {
        this.props.history.goBack()
    }

    submit(e) {
        e.preventDefault()

        let keywords = this.input.value
        this.setState({
            keywords
        })
        
        this.addSearchHistory(keywords)

        let path = `/search/${encodeURIComponent(keywords)}`
        this.state.isSearchResultPage ? this.props.history.replace(path) : this.props.history.push(path)
    }

    keywordsClick(keywords) {
        this.addSearchHistory(keywords)

        this.props.history.push(`/search/${encodeURIComponent(keywords)}`)
    }

    addSearchHistory(keywords) {
        keywords = keywords.trim()
        
        if (!keywords) {
            return
        }
        
        this.props.addSearchHistory(keywords)

        if (this.state.isSearchResultPage) {
            setTimeout(() => {
                this.resetState()
                this.loadSearchResult()
            }, 0)
        }
    }

    rmSearchHistory(keywords) {
        this.props.rmSearchHistory(keywords)
    }

    onTabClick(index) {
        let tab = this.state.tabs[index]
        this.setState({
            currentIndex: index
        })

        // 保存tab状态
        // this.props.history.push()

        setTimeout(() => {
            tab.list.length === 0 && this.loadSearchResult()
        }, 0)
    }

    itemClick(row, col) {
        let path = this.state.tabs[col].path
        if (!path) {
            return
        }

        let id = this.state.tabs[col].list[row].id
        this.props.history.push(path + '/' + id)
    }

    resetState() {
        let tabs = this.state.tabs.map(item => ({
            ...item,
            list: [],
            count: 0
        }))
        
        this.setState({
            tabs,
            currentIndex: 0
        })
    }

    render() {
        let { keywords, isSearchResultPage, tabs, currentIndex, loading, probeType } = this.state
        let { searchHistory, rmSearchHistory } = this.props

        return (
            <div>
                <form className="search-box" onSubmit={(e) => this.submit(e)}>
                    <i className="iconfont back" onClick={() => this.goBack()}>&#xe606;</i>
                    <input type="text" ref={input => this.input = input} className="search-input" defaultValue={keywords} placeholder="请输入关键词..."/>
                </form>
                {
                    !isSearchResultPage && <HistoryList searchHistory={searchHistory} onKeywordsClick={(keywords) => this.keywordsClick(keywords)} onCloseClick={rmSearchHistory} />
                }
                {
                    isSearchResultPage && <TabMenu currentIndex={currentIndex} tabs={tabs} onTabClick={(index) => this.onTabClick(index)} />
                }
                {
                    isSearchResultPage && tabs.map((item, index) => (
                        <div className={classNames({ 'search-result-wrapper': true, active: currentIndex === index })} key={item.type}>
                            <Scroll pullupFunc={() => this.loadSearchResult()} probeType={probeType}>
                                <div>
                                    <item.component list={item.list} onContentClick={(row) => this.itemClick(row, index)} />
                                    <Loading complete={item.list.length !== 0 && item.list.length >= item.count} show={currentIndex === index && loading === true} />
                                </div>
                            </Scroll>
                        </div>
                    ))
                }
            </div>
        )
    }
}

const mapStateToProps = state => {
    let search = state.search
    return {
        searchHistory: search.history
    }
}

const mapDispatchToProps = {
    getSearchSuggest,
    addSearchHistory,
    rmSearchHistory
}

export default connect(mapStateToProps, mapDispatchToProps)(Search)