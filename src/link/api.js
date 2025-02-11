let abortFunctions = [];

export const prefixSearch = ( lang, term, callback ) => {
	const params = {
		action: 'query',
		prop: 'description|pageimages|pageprops',
		piprop: 'thumbnail',
		pilimit: 5,
		ppprop: 'displaytitle',
		generator: 'prefixsearch',
		redirects: true,
		pithumbsize: 64,
		gpslimit: 5,
		gpsnamespace: 0,
		gpssearch: term.replace( /:/g, ' ' ),
	};

	const url = buildMwApiUrl( lang, params );
	return request( url, ( data ) => {
		if ( ! data.query?.pages ) {
			callback( [] );
		} else {
			data.query.pages.sort( ( a, b ) => a.index - b.index );
			callback(
				Object.values( data.query.pages ).map( ( page ) => {
					return {
						title: page.title,
						description: page.description,
						thumbnail: page.thumbnail?.source,
					};
				} )
			);
		}
	} );
};

export const fulltextSearch = ( lang, term, callback ) => {
	const params = {
		action: 'query',
		list: 'search',
		srprop: 'snippet',
		srsearch: term,
		srnamespace: 0,
		srlimit: 5,
		srenablerewrites: true,
		srinfo: 'rewrittenquery',
		prop: 'pageimages',
		piprop: 'thumbnail',
		pithumbsize: 64,
		pilimit: 5,
		generator: 'search',
		gsrsearch: term,
		gsrnamespace: 0,
		gsrlimit: 5,
	};

	const url = buildMwApiUrl( lang, params );
	return request( url, ( data ) => {
		if ( ! data.query?.search ) {
			callback( [] );
		} else {
			const { search, pages } = data.query;
			callback(
				Object.values( search ).map( ( item ) => {
					const page =
						pages &&
						pages.find( ( { pageid } ) => pageid === item.pageid );
					return {
						title: item.title,
						description: stripHtml( item.snippet ),
						thumbnail: page.thumbnail?.source,
					};
				} )
			);
		}
	} );
};

export const abortAllRequest = () => {
	abortFunctions.forEach( ( x ) => x && x.abort() );
	abortFunctions = [];
};

const defautParams = {
	format: 'json',
	formatversion: 2,
	origin: '*',
};

const buildMwApiUrl = ( lang, params ) => {
	params = Object.assign( {}, defautParams, params );
	const baseUrl = `https://${ lang }.wikipedia.org/w/api.php`;
	return (
		baseUrl +
		'?' +
		Object.keys( params )
			.map( ( p ) => {
				return `${ p }=${ encodeURIComponent( params[ p ] ) }`;
			} )
			.join( '&' )
	);
};

const request = ( url, callback ) => {
	abortAllRequest();

	const xhr = new XMLHttpRequest();
	xhr.open( 'GET', url );
	xhr.send();
	xhr.addEventListener( 'load', () => {
		callback( JSON.parse( xhr.responseText ) );
	} );
	xhr.addEventListener( 'error', () => {
		callback( null, xhr.status );
	} );

	abortFunctions.push( xhr );
};

const stripHtml = ( html ) => {
	const tmp = document.createElement( 'DIV' );
	tmp.innerHTML = html;
	return tmp.textContent || tmp.innerText || '';
};
