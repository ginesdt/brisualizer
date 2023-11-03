import ReactPaginate from 'react-paginate';

export function Navigator({pageIndex, setPageIndex, lastPage}: {pageIndex: number, setPageIndex: (page: number) => void, lastPage: number}) {
    return (
        <ReactPaginate
            onPageChange={({selected}) => setPageIndex(selected)}
            pageCount={lastPage}
            forcePage={pageIndex}

            nextLabel="next >"
            pageRangeDisplayed={3}
            marginPagesDisplayed={3}
            previousLabel="< previous"
            pageClassName="page-item"
            pageLinkClassName="page-link"
            previousClassName="page-item"
            previousLinkClassName="page-link"
            nextClassName="page-item"
            nextLinkClassName="page-link"
            breakLabel="..."
            breakClassName="page-item"
            breakLinkClassName="page-link"
            containerClassName="pagination"
            activeClassName="active"
            renderOnZeroPageCount={null}
        />
    );

}